export interface DrawingSession {
  id: string;
  word: string;
  artistId: string;
  drawingData: string; // base64 or JSON
  guesses: Guess[];
  startedAt: Date;
  endsAt: Date;
  isActive: boolean;
  currentGame: number; // Current game number (1-5)
  maxGames: number; // Total games in session (5)
  gameHistory: GameResult[]; // History of completed games
  totalScores: Record<string, number>; // Total scores per user
  players: string[]; // List of player IDs who joined the session
}

export interface GameResult {
  gameNumber: number;
  word: string;
  guesses: Guess[];
  completedAt: Date;
  scores: Record<string, number>; // Scores for this game
}

export interface Guess {
  id: string;
  userId: string;
  guess: string;
  isCorrect: boolean;
  timestamp: Date;
  pointsEarned: number;
}

export interface Word {
  id: string;
  word: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}


