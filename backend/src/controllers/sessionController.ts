import { Request, Response } from 'express';
import { DrawingSession, Guess, GameResult } from '../types/index.js';
import { createSession, getSession, updateSession, deleteSession } from '../storage/sessions.js';
import { getRandomWord } from '../storage/words.js';
import { startSessionSchema, submitGuessSchema, saveDrawingSchema } from '../validators/index.js';

export function startSession(req: Request, res: Response) {
  try {
    const validated = startSessionSchema.parse(req.body);
    const { artistId } = validated;

    const word = getRandomWord();
    
    const now = new Date();
    const endsAt = new Date(now.getTime() + 60000); // 60 seconds per game

    const session: DrawingSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      word: word.word,
      artistId,
      drawingData: '',
      guesses: [],
      startedAt: now,
      endsAt,
      isActive: true,
      currentGame: 1,
      maxGames: 5,
      gameHistory: [],
      totalScores: {},
      players: [artistId], // Artist is the first player
    };

    createSession(session);

    res.json({
      session: {
        id: session.id,
        word: session.word,
        endsAt: session.endsAt,
        startedAt: session.startedAt,
        isActive: session.isActive,
        artistId: session.artistId,
        currentGame: session.currentGame,
        maxGames: session.maxGames,
        players: session.players || [],
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function saveDrawing(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validated = saveDrawingSchema.parse(req.body);
    const { drawingData } = validated;

    const session = getSession(id);
    if (!session) {
      return res.status(404).json({ error: 'Session tapılmadı' });
    }

    const now = new Date();
    if (now > session.endsAt) {
      updateSession(id, { isActive: false });
      return res.status(400).json({ error: 'Vaxt bitib, rəsm saxlanıla bilməz' });
    }

    if (!session.isActive) {
      return res.status(400).json({ error: 'Session aktiv deyil' });
    }

    updateSession(id, { drawingData });

    res.json({ success: true, message: 'Rəsm saxlanıldı' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function submitGuess(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validated = submitGuessSchema.parse(req.body);
    const { userId, guess } = validated;

    const session = getSession(id);
    if (!session) {
      return res.status(404).json({ error: 'Session tapılmadı' });
    }

    if (!session.isActive) {
      return res.status(400).json({ error: 'Session aktiv deyil' });
    }

    if (userId === session.artistId) {
      return res.status(400).json({ error: 'Artist öz sözünü təxmin edə bilməz' });
    }

    const hasCorrectGuess = session.guesses.some(g => g.isCorrect);
    if (hasCorrectGuess) {
      return res.status(400).json({ error: 'Bu söz artıq təxmin edilib' });
    }

    const now = new Date();
    if (now > session.endsAt) {
      // Time's up - finish current game and start next
      finishCurrentGameAndStartNext(id, session);
      const updatedSession = getSession(id);
      if (updatedSession && !updatedSession.isActive) {
        // All games completed
        return res.status(400).json({ 
          error: 'Vaxt bitib - Bütün oyunlar tamamlandı',
          correctWord: session.word,
          allGamesCompleted: true
        });
      }
      // Next game started
      return res.status(400).json({ 
        error: 'Vaxt bitib - Növbəti oyun başladı',
        correctWord: session.word,
        nextGameStarted: true
      });
    }

    const isCorrect = guess.toLowerCase().trim() === session.word.toLowerCase().trim();
    
    let pointsEarned = 0;
    if (isCorrect) {
      const timeElapsed = Date.now() - session.startedAt.getTime();
      const timeLeft = session.endsAt.getTime() - Date.now();
      pointsEarned = Math.max(1, Math.floor((timeLeft / 60000) * 100));
    }

    const newGuess: Guess = {
      id: `guess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      guess,
      isCorrect,
      timestamp: new Date(),
      pointsEarned,
    };

    // Add user to players list if not already there
    const currentPlayers = session.players || [];
    if (!currentPlayers.includes(userId)) {
      currentPlayers.push(userId);
    }

    const updatedGuesses = [...session.guesses, newGuess];
    updateSession(id, { guesses: updatedGuesses, players: currentPlayers });

    if (isCorrect) {
      // Check if ALL players (excluding artist) have found the answer
      const sessionWithNewGuess = getSession(id) || session;
      const allPlayers = sessionWithNewGuess.players || [];
      const playersToCheck = allPlayers.filter(p => p !== session.artistId); // Exclude artist
      
      // Get all players who have found the correct answer
      const playersWhoFoundIt = sessionWithNewGuess.guesses
        .filter(g => g.isCorrect)
        .map(g => g.userId);
      const uniquePlayersWhoFoundIt = [...new Set(playersWhoFoundIt)];
      
      // Check if all players have found it (or if no players joined yet, just this one)
      const allPlayersFoundIt = playersToCheck.length === 0 || 
        (playersToCheck.length > 0 && uniquePlayersWhoFoundIt.length >= playersToCheck.length);
      
      // Only transition to next game if ALL players have found the answer
      if (allPlayersFoundIt) {
        // All players found it - finish current game and start next
        finishCurrentGameAndStartNext(id, sessionWithNewGuess);
        
        // Get updated session after finishing current game and starting next
        const updatedSession = getSession(id);
        
        // Return info about next game or completion
        if (updatedSession && !updatedSession.isActive) {
          // All games completed
          res.json({
            isCorrect,
            pointsEarned,
            correctWord: session.word,
            allGamesCompleted: true,
            allPlayersFoundAnswer: true,
          });
          return;
        }
        
        // Next game started
        res.json({
          isCorrect,
          pointsEarned,
          correctWord: session.word,
          nextGameStarted: true,
          currentGame: updatedSession?.currentGame || 1,
          maxGames: updatedSession?.maxGames || 5,
          newWord: updatedSession?.word, // Send new word for artist
          allPlayersFoundAnswer: true,
        });
        return;
      } else {
        // Not all players found it yet - game continues
        // Return success but don't transition to next game
        res.json({
          isCorrect,
          pointsEarned,
          correctWord: session.word,
          allPlayersFoundAnswer: false,
          playersFoundCount: uniquePlayersWhoFoundIt.length,
          totalPlayersCount: playersToCheck.length,
        });
        return;
      }
    }

    res.json({
      isCorrect,
      pointsEarned,
      correctWord: isCorrect ? session.word : undefined,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getRandomWordController(req: Request, res: Response) {
  try {
    const difficulty = req.query.difficulty as 'easy' | 'medium' | 'hard' | undefined;
    const word = getRandomWord(difficulty);
    
    res.json({ word: word.word });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

function finishCurrentGameAndStartNext(sessionId: string, session: DrawingSession) {
  // Calculate scores for this game - include all correct guesses
  const gameScores: Record<string, number> = {};
  
  // Get the latest session to ensure we have all guesses
  const latestSession = getSession(sessionId) || session;
  
  latestSession.guesses.forEach(guess => {
    if (guess.isCorrect && guess.pointsEarned > 0) {
      gameScores[guess.userId] = (gameScores[guess.userId] || 0) + guess.pointsEarned;
    }
  });

  // Update total scores
  const totalScores = { ...(latestSession.totalScores || {}) };
  Object.keys(gameScores).forEach(userId => {
    totalScores[userId] = (totalScores[userId] || 0) + gameScores[userId];
  });

  // Save game result - use latest session data
  const gameResult: GameResult = {
    gameNumber: latestSession.currentGame || 1,
    word: latestSession.word,
    guesses: [...latestSession.guesses],
    completedAt: new Date(),
    scores: gameScores,
  };

  const gameHistory = [...(latestSession.gameHistory || []), gameResult];
  const currentGame = latestSession.currentGame || 1;
  const maxGames = latestSession.maxGames || 5;

  // Check if we've completed all 5 games
  if (currentGame >= maxGames) {
    // All games completed - end session
    updateSession(sessionId, {
      isActive: false,
      gameHistory,
      totalScores,
      guesses: [],
    });
    return;
  }

  // Start next game
  const newWord = getRandomWord();
  const now = new Date();
  const endsAt = new Date(now.getTime() + 60000); // 60 seconds per game

  // Preserve players list from latest session
  const preservedPlayers = latestSession.players || [];

  updateSession(sessionId, {
    word: newWord.word,
    drawingData: '',
    guesses: [],
    startedAt: now,
    endsAt,
    isActive: true,
    currentGame: currentGame + 1,
    maxGames: maxGames,
    gameHistory,
    totalScores,
    players: preservedPlayers, // Keep existing players
  });
}

export function endSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const session = getSession(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session tapılmadı' });
    }

    // Check if all players found the answer before time ended
    const allPlayers = session.players || [];
    const playersToCheck = allPlayers.filter(p => p !== session.artistId);
    const playersWhoFoundIt = session.guesses
      .filter(g => g.isCorrect)
      .map(g => g.userId);
    const uniquePlayersWhoFoundIt = [...new Set(playersWhoFoundIt)];
    const allPlayersFoundIt = playersToCheck.length === 0 || 
      (playersToCheck.length > 0 && uniquePlayersWhoFoundIt.length >= playersToCheck.length);

    // Finish current game and start next (or end if all games done)
    // Get latest session before finishing to ensure we have all guesses
    const latestSession = getSession(id) || session;
    finishCurrentGameAndStartNext(id, latestSession);
    
    // Get updated session after finishing
    const updatedSession = getSession(id);
    
    if (!updatedSession) {
      return res.status(404).json({ error: 'Session tapılmadı' });
    }
    
    if (!updatedSession.isActive) {
      // All games completed - return final results with scores
      res.json({ 
        success: true, 
        message: 'Bütün oyunlar bitdi',
        session: {
          totalScores: updatedSession.totalScores || {},
          gameHistory: updatedSession.gameHistory || [],
          allGamesCompleted: true,
          timeEnded: true,
          allPlayersFoundAnswer: allPlayersFoundIt,
        },
      });
    } else {
      // Next game started
      res.json({ 
        success: true, 
        message: 'Növbəti oyun başladı',
        session: {
          currentGame: updatedSession.currentGame || 1,
          maxGames: updatedSession.maxGames || 5,
          word: updatedSession.word,
          endsAt: updatedSession.endsAt,
          totalScores: updatedSession.totalScores || {},
          timeEnded: true,
          allPlayersFoundAnswer: allPlayersFoundIt,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getSessionInfo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    let session = getSession(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session tapılmadı' });
    }

    const now = new Date();
    if (session.isActive && now > session.endsAt) {
      updateSession(id, { isActive: false });
      session = getSession(id);
    }

    if (!session) {
      return res.status(404).json({ error: 'Session tapılmadı' });
    }

    const isArtist = req.query.userId === session.artistId;
    const showWord = isArtist || !session.isActive;
    
    // Add current user to players list if they're viewing the session
    const currentUserId = req.query.userId as string;
    const currentPlayers = session.players || [];
    if (currentUserId && !currentPlayers.includes(currentUserId) && currentUserId !== session.artistId) {
      currentPlayers.push(currentUserId);
      updateSession(id, { players: currentPlayers });
      // Refresh session to get updated players list
      session = getSession(id);
      if (!session) {
        return res.status(404).json({ error: 'Session tapılmadı' });
      }
    }
    
    res.json({
      session: {
        id: session.id,
        word: showWord ? session.word : undefined,
        artistId: session.artistId,
        drawingData: session.drawingData,
        guesses: session.guesses.map(g => ({
          id: g.id,
          userId: g.userId,
          guess: g.guess,
          isCorrect: g.isCorrect,
          timestamp: g.timestamp,
          pointsEarned: g.pointsEarned,
        })),
        startedAt: session.startedAt,
        endsAt: session.endsAt,
        isActive: session.isActive,
        currentGame: session.currentGame || 1,
        maxGames: session.maxGames || 5,
        totalScores: session.totalScores || {},
        gameHistory: session.gameHistory || [],
        allGamesCompleted: !session.isActive && (session.currentGame || 0) >= (session.maxGames || 5),
        players: session.players || [],
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

