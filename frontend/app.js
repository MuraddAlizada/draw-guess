const API_URL = window.location.hostname === 'localhost' 
    ? "/api" 
    : (window.API_URL || "/api");
const userIdInput = document.getElementById("userId");
const startBtn = document.getElementById("startBtn");
const gameArea = document.getElementById("gameArea");
const waitingArea = document.getElementById("waitingArea");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const brushSizeValue = document.getElementById("brushSizeValue");
const clearBtn = document.getElementById("clearBtn");
const saveDrawingBtn = document.getElementById("saveDrawingBtn");
const timerDisplay = document.getElementById("timer");
const wordDisplay = document.getElementById("wordDisplay");
const scoreDisplay = document.getElementById("score");
const currentGameDisplay = document.getElementById("currentGame");
const maxGamesDisplay = document.getElementById("maxGames");
const sessionIdDisplay = document.getElementById("sessionId");
const artistIdDisplay = document.getElementById("artistId");
const guessInput = document.getElementById("guessInput");
const submitGuessBtn = document.getElementById("submitGuessBtn");
const guessesUl = document.getElementById("guessesUl");
const resultMessage = document.getElementById("resultMessage");
const drawingImage = document.getElementById("drawingImage");
const drawingDisplay = document.getElementById("drawingDisplay");
const waitingSessionId = document.getElementById("waitingSessionId");
const colorButtons = document.querySelectorAll(".color-btn");
const joinBtn = document.getElementById("joinBtn");
const joinSessionIdInput = document.getElementById("joinSessionId");
const sessionShareBox = document.getElementById("sessionShareBox");
const sessionIdToCopy = document.getElementById("sessionIdToCopy");
const copySessionBtn = document.getElementById("copySessionBtn");
const gameEndBox = document.getElementById("gameEndBox");
const finalResults = document.getElementById("finalResults");
const newGameBtn = document.getElementById("newGameBtn");
const timeUpModal = document.getElementById("timeUpModal");
const timeUpResults = document.getElementById("timeUpResults");
const confirmNewGameBtn = document.getElementById("confirmNewGameBtn");
const newGameModal = document.getElementById("newGameModal");
const yesNewGameBtn = document.getElementById("yesNewGameBtn");
const noNewGameBtn = document.getElementById("noNewGameBtn");
const gameCompletedModal = document.getElementById("gameCompletedModal");
const gameCompletedResults = document.getElementById("gameCompletedResults");
const goToHomeBtn = document.getElementById("goToHomeBtn");
const drawingSection = document.querySelector(".drawing-section");
const guessingSection = document.querySelector(".guessing-section");
const playersListSection = document.getElementById("playersListSection");
const playersList = document.getElementById("playersList");
const viewerCanvasContainer = document.getElementById("viewerCanvasContainer");
const viewerCanvas = document.getElementById("viewerCanvas");

// Game State
let currentSession = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = "#000000";
let currentBrushSize = 5;
let timerInterval = null;
let pollingInterval = null;
let score = 0;
let isArtist = false;
let lastUserId = null;
let autoSaveTimeout = null;
let lastSavedDrawing = null;
let lastReceivedDrawingData = null; // Track last received drawing data from server
ctx.strokeStyle = currentColor;
ctx.lineWidth = currentBrushSize;
ctx.lineCap = "round";
ctx.lineJoin = "round";

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    startDrawing({
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
    });
});

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    draw({
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
    });
});

canvas.addEventListener("touchend", stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    
    [lastX, lastY] = [e.offsetX, e.offsetY];
    
    // Auto-save drawing in real-time (throttled)
    if (isArtist && currentSession) {
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }
        autoSaveTimeout = setTimeout(async () => {
            await autoSaveDrawing();
        }, 300); // Save every 300ms while drawing for better real-time sync
    }
}

function stopDrawing() {
    isDrawing = false;
}

colorPicker.addEventListener("change", (e) => {
    currentColor = e.target.value;
    ctx.strokeStyle = currentColor;
});

colorButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        currentColor = btn.dataset.color;
        colorPicker.value = currentColor;
        ctx.strokeStyle = currentColor;
    });
});

brushSize.addEventListener("input", (e) => {
    currentBrushSize = parseInt(e.target.value);
    brushSizeValue.textContent = currentBrushSize;
    ctx.lineWidth = currentBrushSize;
});

clearBtn.addEventListener("click", async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Auto-save after clearing
    if (isArtist && currentSession) {
        await autoSaveDrawing();
    }
});

startBtn.addEventListener("click", async () => {
    // Prevent non-artist from starting new game
    if (!isArtist && currentSession) {
        alert("Yalnız session sahibi yeni oyun başlada bilər!");
        return;
    }
    
    const userId = userIdInput.value.trim();
    if (!userId) {
        alert("İstifadəçi ID daxil edin!");
        return;
    }

    lastUserId = userId;
    
    await startNewGame(userId);
});

async function startNewGame(userId) {
    try {
        const response = await fetch(`${API_URL}/sessions/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ artistId: userId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Xəta baş verdi");
        }

        const data = await response.json();
        currentSession = data.session;
        isArtist = true;

        // Hide start/join buttons when game starts
        startBtn.style.display = "none";
        joinBtn.style.display = "none";
        joinSessionIdInput.style.display = "none";
        
        // Hide action groups in header
        const actionGroups = document.querySelectorAll(".action-group");
        actionGroups.forEach(group => {
            group.style.display = "none";
        });
        const actionDivider = document.querySelector(".action-divider");
        if (actionDivider) {
            actionDivider.style.display = "none";
        }
        
        gameArea.style.display = "block";
        waitingArea.style.display = "none";
        wordDisplay.textContent = `Word: ${currentSession.word}`;
        wordDisplay.style.display = "block";
        sessionIdDisplay.textContent = currentSession.id;
        artistIdDisplay.textContent = userId;
        
        sessionIdToCopy.value = currentSession.id;
        sessionShareBox.style.display = "block";
        
        // Show drawing section for artist
        if (drawingSection) {
            drawingSection.style.display = "block";
        }
        
        // Hide guessing section for artist (artist doesn't guess)
        if (guessingSection) {
            guessingSection.style.display = "none";
        }
        
        // Hide viewer canvas for artist
        if (viewerCanvasContainer) {
            viewerCanvasContainer.style.display = "none";
        }
        
        // Show players list for artist - ALWAYS show
        if (playersListSection) {
            playersListSection.style.display = "block";
        }
        if (playersList) {
            // Initialize players list with just the artist
            updatePlayersList(currentSession);
        }
        
        // Update main-content layout for artist (drawing section + players list)
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            mainContent.classList.remove("single-column");
            mainContent.classList.add("artist-only");
        }
        
        // Show new game button for artist
        if (newGameBtn) {
            newGameBtn.style.display = "block";
        }
        
        // Start timer immediately when artist starts the game
        // Timer starts counting down from 60 seconds as soon as game is created
        if (currentSession.endsAt) {
            const endTime = currentSession.endsAt instanceof Date 
                ? currentSession.endsAt 
                : new Date(currentSession.endsAt);
            startTimer(endTime);
        }
        
        // Start polling to get updates
        startPolling();
    } catch (error) {
        alert("Xəta: " + error.message);
    }
}

// Auto-save drawing function (throttled)
async function autoSaveDrawing() {
    if (!currentSession || !isArtist) return;
    
    try {
        const dataURL = canvas.toDataURL();
        
        // Only save if drawing has changed
        if (dataURL === lastSavedDrawing) return;
        lastSavedDrawing = dataURL;
        
        const encodedSessionId = encodeURIComponent(currentSession.id);
        const response = await fetch(`${API_URL}/sessions/${encodedSessionId}/drawing`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ drawingData: dataURL })
        });

        if (!response.ok) {
            console.error("Auto-save failed");
        }
    } catch (error) {
        console.error("Auto-save error:", error);
    }
}

saveDrawingBtn.addEventListener("click", async () => {
    if (!currentSession) {
        alert("Oyun başlamayıb!");
        return;
    }

    await autoSaveDrawing();
    alert("Rəsm saxlanıldı!");
});

submitGuessBtn.addEventListener("click", async () => {
    await submitGuess();
});

guessInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        submitGuess();
    }
});

async function submitGuess() {
    const userId = userIdInput.value.trim();
    const guess = guessInput.value.trim();

    if (!userId) {
        alert("İstifadəçi ID daxil edin!");
        return;
    }

    if (!guess) {
        alert("Təxmin daxil edin!");
        return;
    }

    if (!currentSession) {
        alert("Session ID daxil edin!");
        return;
    }

    try {
        const encodedSessionId = encodeURIComponent(currentSession.id);
        const response = await fetch(`${API_URL}/sessions/${encodedSessionId}/guess`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, guess })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Xəta baş verdi");
        }

        const data = await response.json();
        
        addGuessToList(userId, guess, data.isCorrect, data.pointsEarned);
        
        if (data.isCorrect) {
            // Show success notification modal first
            showCorrectAnswerFoundNotification(data.pointsEarned);
            
            // Also show success message with points earned
            resultMessage.textContent = `🎉 Təbriklər! Düzgün cavab tapdınız və ${data.pointsEarned} xal qazandınız!`;
            resultMessage.className = "result-message success";
            
            // Disable guessing immediately (player already found it)
            guessInput.disabled = true;
            submitGuessBtn.disabled = true;
            
            // Check if all players found the answer
            if (data.allPlayersFoundAnswer === false) {
                // Not all players found it yet - show waiting message after a delay
                setTimeout(() => {
                    resultMessage.textContent = `⏳ Digər oyunçuların cavab tapmasını gözləyirik... (${data.playersFoundCount || 0}/${data.totalPlayersCount || 0})`;
                    resultMessage.className = "result-message info";
                }, 2500);
                
                // Refresh to get updates
                setTimeout(async () => {
                    await refreshSessionInfo();
                }, 1000);
                return;
            }
            
            // All players found it - proceed with game transition
            guessInput.disabled = true;
            submitGuessBtn.disabled = true;
            
            // Keep success message visible for 3 seconds first
            // Then show next game notification
            
            // Check if all games completed or next game started
            if (data.allGamesCompleted) {
                // Wait a bit then show final results
                setTimeout(async () => {
                    await refreshSessionInfo();
                    if (currentSession) {
                        await showFinalResults(currentSession);
                    }
                }, 3000);
            } else if (data.nextGameStarted) {
                // Wait 3 seconds to show success message, then show next game notification
                setTimeout(() => {
                    // Show next game notification after success message - ONLY for artist
                    if (isArtist) {
                        // Show artist-specific notification
                        showArtistNextWordModal(data.newWord);
                    }
                    // Guest-lər üçün bildiriş göstərilmir
                    
                    // Clear success message
                    resultMessage.textContent = "";
                    resultMessage.className = "";
                }, 3000);
                
                // Wait a bit then refresh to get full session info
                setTimeout(async () => {
                    await refreshSessionInfo();
                    
                    // Re-enable inputs for next game
                    if (currentSession && currentSession.isActive) {
                        guessInput.disabled = false;
                        submitGuessBtn.disabled = false;
                        if (isArtist) {
                            saveDrawingBtn.disabled = false;
                        }
                    }
                }, 4000);
            } else {
                // Just refresh
                setTimeout(async () => {
                    await refreshSessionInfo();
                }, 1000);
            }
        } else {
            // Wrong guess
            resultMessage.textContent = "❌ Yanlış texmin. Yenidən cəhd edin!";
            resultMessage.className = "result-message error";
        }

        guessInput.value = "";
        
        await refreshSessionInfo();
    } catch (error) {
        alert("Xəta: " + error.message);
    }
}

function addGuessToList(userId, guess, isCorrect, points) {
    const li = document.createElement("li");
    li.className = isCorrect ? "correct" : "incorrect";
    li.innerHTML = `
        <strong>${userId}:</strong> "${guess}" 
        ${isCorrect ? `<span class="points">+${points} xal</span>` : ""}
    `;
    guessesUl.appendChild(li);
}

function updatePlayersList(session) {
    if (!playersList || !session) {
        console.log("updatePlayersList: playersList or session missing", { playersList, session });
        return;
    }
    
    playersList.innerHTML = "";
    
    // Always include artist in the list
    const allPlayers = session.players && session.players.length > 0 
        ? [...new Set([session.artistId, ...session.players])] // Remove duplicates, artist first
        : [session.artistId];
    
    if (allPlayers.length > 0) {
        allPlayers.forEach((playerId) => {
            const li = document.createElement("li");
            const isArtistPlayer = playerId === session.artistId;
            li.className = isArtistPlayer ? "player-item artist" : "player-item";
            const playerScore = session.totalScores && session.totalScores[playerId] 
                ? session.totalScores[playerId] 
                : 0;
            li.innerHTML = `
                <span class="player-name">${playerId}</span>
                ${isArtistPlayer ? '<span class="artist-badge">🎨 Artist</span>' : ''}
                <span class="player-score">${playerScore} xal</span>
            `;
            playersList.appendChild(li);
        });
    } else {
        const li = document.createElement("li");
        li.textContent = "Hələ heç kim qoşulmayıb";
        li.className = "player-item empty";
        playersList.appendChild(li);
    }
}

function startTimer(endTime) {
    if (timerInterval) clearInterval(timerInterval);
    
    // Ensure endTime is a Date object
    const endTimeDate = endTime instanceof Date ? endTime : new Date(endTime);
    
    // Update immediately
    const updateTimer = () => {
        const now = new Date();
        const timeLeft = Math.max(0, Math.floor((endTimeDate.getTime() - now.getTime()) / 1000));
        
        timerDisplay.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = null;
            handleTimeUp();
        }
    };
    
    // Update immediately
    updateTimer();
    
    // Then update every second
    timerInterval = setInterval(updateTimer, 1000);
}

async function handleTimeUp() {
    // Stop timer immediately
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Disable inputs immediately
    guessInput.disabled = true;
    submitGuessBtn.disabled = true;
    saveDrawingBtn.disabled = true;
    
    if (currentSession && currentSession.id) {
        try {
            // Check if current user found the answer before time ended
            const userId = userIdInput.value.trim();
            const userFoundIt = currentSession.guesses && 
                currentSession.guesses.some(g => g.userId === userId && g.isCorrect);
            
            const encodedSessionId = encodeURIComponent(currentSession.id);
            const response = await fetch(`${API_URL}/sessions/${encodedSessionId}/end`, {
                method: "POST"
            });
            
            if (!response.ok) {
                // If error, try to refresh session info
                setTimeout(async () => {
                    await refreshSessionInfo();
                }, 1000);
                return;
            }
            
            const data = await response.json();
            
            // Show notification based on whether user found the answer
            if (!isArtist && !userFoundIt) {
                // Player couldn't find the answer
                showTimeUpNoAnswerNotification();
            } else if (!isArtist && userFoundIt) {
                // Player found it but waiting for others
                const pointsEarned = currentSession.guesses.find(g => 
                    g.userId === userId && g.isCorrect
                )?.pointsEarned || 0;
                showTimeUpFoundAnswerNotification(pointsEarned);
            }
            
            // Check if all games completed
            if (data.session && data.session.allGamesCompleted) {
                // Stop polling before showing results
                if (pollingInterval) clearInterval(pollingInterval);
                await showFinalResults(data.session);
                return;
            }
            
            // Wait a bit then refresh to get next game
            setTimeout(async () => {
                await refreshSessionInfo();
                
                // Check if next game started
                if (currentSession && currentSession.isActive) {
                    // Restart polling for next game
                    startPolling();
                    
                    // Show appropriate notification - ONLY for artist
                    if (isArtist) {
                        // Artist notification will be shown when new word is available
                        if (currentSession.word) {
                            showArtistNextWordModal(currentSession.word);
                        }
                    }
                    // Guest-lər üçün bildiriş göstərilmir
                } else if (currentSession && currentSession.allGamesCompleted) {
                    // Stop polling
                    if (pollingInterval) clearInterval(pollingInterval);
                    await showFinalResults(currentSession);
                }
            }, 1500);
        } catch (error) {
            console.error("Session end error:", error);
            // Try to refresh anyway
            setTimeout(async () => {
                await refreshSessionInfo();
            }, 1000);
        }
    }
}

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    
    // Poll more frequently for real-time drawing updates (every 500ms for better sync)
    // But only if session is active
    pollingInterval = setInterval(async () => {
        if (currentSession && currentSession.id) {
            // Only poll if session is still active or we're waiting for final results
            if (currentSession.isActive || currentSession.allGamesCompleted === false) {
                await refreshSessionInfo();
            } else if (currentSession.allGamesCompleted) {
                // Stop polling if all games completed
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
        } else {
            // No session, stop polling
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }, 500); // Reduced from 1000ms to 500ms for better real-time sync
}

async function refreshSessionInfo() {
    if (!currentSession || !currentSession.id) return;

    try {
        const userId = userIdInput.value.trim();
        const sessionId = currentSession.id;
        
        if (!sessionId) {
            console.error("refreshSessionInfo: No session ID");
            return;
        }
        
        const encodedSessionId = encodeURIComponent(sessionId);
        const encodedUserId = encodeURIComponent(userId);
        const response = await fetch(`${API_URL}/sessions/${encodedSessionId}?userId=${encodedUserId}`);
        
        if (!response.ok) {
            // If session not found or error, stop polling
            if (response.status === 404) {
                clearInterval(pollingInterval);
                if (timerInterval) clearInterval(timerInterval);
            }
            return;
        }
        
        const data = await response.json();
        const session = data.session;
        
        if (!session) return;
        
        // Store previous session state BEFORE updating currentSession
        // Make a proper copy to avoid reference issues
        const previousSession = {
            ...currentSession,
            players: currentSession.players ? [...currentSession.players] : [],
            gameHistory: currentSession.gameHistory ? [...currentSession.gameHistory] : [],
            guesses: currentSession.guesses ? [...currentSession.guesses] : []
        };
        const previousPlayers = previousSession.players || [];
        const previousGameHistory = previousSession.gameHistory || [];
        const previousWord = previousSession.word;
        const previousStartedAt = previousSession.startedAt;
        const previousCurrentGame = previousSession.currentGame || 1;
        
        // Check if all games completed
        if (session.allGamesCompleted) {
            clearInterval(pollingInterval);
            if (timerInterval) clearInterval(timerInterval);
            // Stop polling before showing results
            if (pollingInterval) clearInterval(pollingInterval);
            await showFinalResults(session);
            return;
        }
        
        // Update game progress
        if (currentGameDisplay) {
            currentGameDisplay.textContent = session.currentGame || 1;
        }
        if (maxGamesDisplay) {
            maxGamesDisplay.textContent = session.maxGames || 5;
        }
        
        // Check if this is a new game (different startedAt time, different word, or game number increased)
        const isNewGame = (previousStartedAt && session.startedAt && 
            new Date(previousStartedAt).getTime() !== new Date(session.startedAt).getTime()) ||
            (previousWord && previousWord !== session.word) ||
            (session.currentGame > previousCurrentGame);
        
        // Check if word changed (new game started)
        const wordChanged = previousWord && session.word && previousWord !== session.word;
        
        // Check if someone found the correct answer by checking gameHistory
        // When a correct guess is made, a new game result is added to gameHistory
        const currentGameHistory = session.gameHistory || [];
        const newGameResult = currentGameHistory.length > previousGameHistory.length 
            ? currentGameHistory[currentGameHistory.length - 1] 
            : null;
        
        // Notify artist if someone found the answer (check for new correct guesses)
        if (isArtist) {
            const previousCorrectGuesses = previousSession.guesses
                .filter(g => g.isCorrect)
                .map(g => g.userId);
            const currentCorrectGuesses = session.guesses
                .filter(g => g.isCorrect)
                .map(g => g.userId);
            
            // Find newly correct guesses (players who just found the answer)
            const newCorrectGuesses = session.guesses.filter(g => 
                g.isCorrect && 
                !previousCorrectGuesses.includes(g.userId)
            );
            
            // Show notification for each new player who found it
            newCorrectGuesses.forEach(guess => {
                showCorrectAnswerNotification(guess.userId, guess.guess, guess.pointsEarned);
            });
        }
        
        // Update word display for artist - always update when word is available
        if (isArtist && session.word) {
            // Always update word display - check if it actually changed
            const wordActuallyChanged = previousWord !== session.word;
            if (wordActuallyChanged || !previousWord) {
                wordDisplay.textContent = `Word: ${session.word}`;
                wordDisplay.style.display = "block";
            }
            
            // If new game started, clear canvas and reset drawing
            if (isNewGame) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                lastSavedDrawing = null;
                saveDrawingBtn.disabled = false;
                guessInput.disabled = false;
                submitGuessBtn.disabled = false;
                resultMessage.textContent = "";
                resultMessage.className = "";
                
                // Show notification for new game (but not if we already showed correct answer notification)
                // ONLY for artist, not for guests
                if (isArtist && session.currentGame > 1 && !newGameResult) {
                    showNextGameNotification();
                }
            }
        }
        
        // Update currentSession
        currentSession = session;
        
        // For non-artist: show live drawing in canvas (readonly)
        // Only update if drawing data has changed
        if (session.drawingData && !isArtist && viewerCanvas) {
            // Only update if drawing data actually changed
            if (session.drawingData !== lastReceivedDrawingData) {
                lastReceivedDrawingData = session.drawingData;
                const viewerCtx = viewerCanvas.getContext("2d");
                const img = new Image();
                img.onload = () => {
                    // Calculate size to fit container without scrollbar
                    const container = viewerCanvas.parentElement;
                    const maxWidth = container ? container.clientWidth - 30 : 800;
                    const maxHeight = 500;
                    const aspectRatio = img.width / img.height;
                    
                    let newWidth = Math.min(maxWidth, img.width);
                    let newHeight = newWidth / aspectRatio;
                    
                    if (newHeight > maxHeight) {
                        newHeight = maxHeight;
                        newWidth = newHeight * aspectRatio;
                    }
                    
                    viewerCanvas.width = newWidth;
                    viewerCanvas.height = newHeight;
                    viewerCtx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
                    viewerCtx.drawImage(img, 0, 0, newWidth, newHeight);
                };
                img.onerror = () => {
                    console.error("Failed to load drawing image");
                };
                img.src = session.drawingData;
            }
        } else if (!session.drawingData && !isArtist && viewerCanvas) {
            // Clear canvas if no drawing data
            const viewerCtx = viewerCanvas.getContext("2d");
            viewerCtx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
            lastReceivedDrawingData = null;
        }
        
        // Check if session was restarted (new word, new artist)
        if (session.startedAt && previousStartedAt) {
            const oldTime = new Date(previousStartedAt).getTime();
            const newTime = new Date(session.startedAt).getTime();
            const sessionChanged = oldTime !== newTime;
            
            // Guest-lər üçün "artist yeni oyun başlatdı" bildirişi göstərilmir
            // Yalnız drawing-i təmizlə
            if (sessionChanged && !isArtist) {
                // Clear old drawing without showing notification
                if (viewerCanvas) {
                    const viewerCtx = viewerCanvas.getContext("2d");
                    viewerCtx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
                }
            }
        }
        
        guessesUl.innerHTML = "";
        session.guesses.forEach(guess => {
            addGuessToList(guess.userId, guess.guess, guess.isCorrect, guess.pointsEarned);
        });
        
        // Show total score from all games
        const totalScore = session.totalScores && session.totalScores[userId] ? session.totalScores[userId] : 0;
        scoreDisplay.textContent = totalScore;
        
        // Update players list for artist - always show if artist
        if (isArtist) {
            // Always show players list section for artist
            if (playersListSection) {
                playersListSection.style.display = "block";
            }
            if (playersList) {
                // Get current players list (exclude artist from comparison)
                const currentPlayers = (session.players || []).filter(p => p !== session.artistId);
                const prevPlayersFiltered = previousPlayers.filter(p => p !== session.artistId);
                
                // Check if new players joined by comparing arrays
                const newPlayers = currentPlayers.filter(p => !prevPlayersFiltered.includes(p));
                
                // Always update players list to ensure it's current
                updatePlayersList(session);
                
                // Show notification if new players joined
                if (newPlayers.length > 0) {
                    showPlayerJoinedNotification(newPlayers);
                }
            }
        }
        
        // Check if game ended and next game should start
        if (!session.isActive && !session.allGamesCompleted) {
            // Game ended - wait a bit then check for next game
            // Stop polling temporarily to avoid errors
            clearInterval(pollingInterval);
            
            setTimeout(async () => {
                await refreshSessionInfo();
                if (currentSession && currentSession.isActive) {
                    // Next game started - restart polling
                    startPolling();
                    // Show notification ONLY for artist, not for guests
                    if (isArtist) {
                        showNextGameNotification();
                    }
                } else if (currentSession && currentSession.allGamesCompleted) {
                    // All games completed
                    if (timerInterval) clearInterval(timerInterval);
                    await showFinalResults(currentSession);
                }
            }, 1500);
            return;
        }
        
        // If session is active, restart timer if needed
        if (session.isActive && session.endsAt) {
            const now = new Date();
            const endTime = new Date(session.endsAt);
            if (endTime > now) {
                // Restart timer for new game only if not already running
                const currentTimeLeft = Math.floor((endTime.getTime() - now.getTime()) / 1000);
                const displayedTime = parseInt(timerDisplay.textContent) || 0;
                
                // Only restart if timer is significantly different or not running
                if (Math.abs(currentTimeLeft - displayedTime) > 2 || !timerInterval) {
                    if (timerInterval) clearInterval(timerInterval);
                    startTimer(endTime);
                }
            }
        }
    } catch (error) {
        console.error("Session refresh error:", error);
    }
}

async function joinSession(sessionId) {
    try {
        const userId = userIdInput.value.trim();
        if (!userId) {
            alert("İstifadəçi ID daxil edin!");
            return;
        }

        if (!sessionId || !sessionId.trim()) {
            alert("Session ID daxil edin!");
            return;
        }

        // Trim and encode session ID for URL
        const trimmedSessionId = sessionId.trim();
        const encodedSessionId = encodeURIComponent(trimmedSessionId);
        const encodedUserId = encodeURIComponent(userId);
        
        const response = await fetch(`${API_URL}/sessions/${encodedSessionId}?userId=${encodedUserId}`);
        
        if (!response.ok) {
            let errorMessage = "Session tapılmadı";
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.status === 404 ? "Session tapılmadı" : "Xəta baş verdi";
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        currentSession = data.session;
        isArtist = false;
        
        // Hide start/join buttons when joining
        startBtn.style.display = "none";
        joinBtn.style.display = "none";
        joinSessionIdInput.style.display = "none";
        
        // Hide action groups in header for joined players (completely disable new game)
        const actionGroups = document.querySelectorAll(".action-group");
        actionGroups.forEach(group => {
            group.style.display = "none";
        });
        const actionDivider = document.querySelector(".action-divider");
        if (actionDivider) {
            actionDivider.style.display = "none";
        }
        
        // Also hide start button completely for guests
        startBtn.style.display = "none";
        startBtn.disabled = true;
        
        gameArea.style.display = "block";
        waitingArea.style.display = "none";
        sessionShareBox.style.display = "none";
        wordDisplay.style.display = "none";
        sessionIdDisplay.textContent = sessionId;
        artistIdDisplay.textContent = currentSession.artistId;
        
        // Hide drawing section for non-artist (joined players)
        if (drawingSection) {
            drawingSection.style.display = "none";
        }
        
        // Hide players list for non-artist
        if (playersListSection) {
            playersListSection.style.display = "none";
        }
        
        // Show guessing section for non-artist
        if (guessingSection) {
            guessingSection.style.display = "block";
        }
        
        // Show viewer canvas for non-artist
        if (viewerCanvasContainer) {
            viewerCanvasContainer.style.display = "block";
        }
        
        // Update main-content layout when drawing section is hidden
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            mainContent.classList.remove("artist-only");
            mainContent.classList.add("single-column");
        }
        
        // Hide new game button for non-artist
        if (newGameBtn) {
            newGameBtn.style.display = "none";
        }
        
        // Start timer immediately when joining (game is already running)
        // Timer continues from where it is - doesn't restart
        if (currentSession.isActive && currentSession.endsAt) {
            const endTime = currentSession.endsAt instanceof Date 
                ? currentSession.endsAt 
                : new Date(currentSession.endsAt);
            startTimer(endTime);
        }
        
        // Start polling to get updates
        startPolling();
        
        // Refresh session info to get latest data
        await refreshSessionInfo();
    } catch (error) {
        alert("Xəta: " + error.message);
    }
}

joinBtn.addEventListener("click", () => {
    const sessionId = joinSessionIdInput.value.trim();
    if (!sessionId) {
        alert("Session ID daxil edin!");
        return;
    }
    joinSession(sessionId);
});

copySessionBtn.addEventListener("click", () => {
    sessionIdToCopy.select();
    sessionIdToCopy.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(sessionIdToCopy.value).then(() => {
        copySessionBtn.textContent = "✅ Kopyalandı!";
        setTimeout(() => {
            copySessionBtn.textContent = "📋 Kopyala";
        }, 2000);
    }).catch(() => {
        document.execCommand('copy');
        copySessionBtn.textContent = "✅ Kopyalandı!";
        setTimeout(() => {
            copySessionBtn.textContent = "📋 Kopyala";
        }, 2000);
    });
});

function showTimeUpModal() {
    if (!timeUpModal || !timeUpResults) return;
    
    timeUpModal.style.display = "flex";
    
    if (currentSession) {
        const correctGuesses = currentSession.guesses ? currentSession.guesses.filter(g => g.isCorrect) : [];
        const allGuesses = currentSession.guesses || [];
        
        let resultsHTML = '';
        
        if (currentSession.word) {
            resultsHTML += `
                <div class="correct-word-box">
                    <p class="correct-word-label">Düzgün cavab:</p>
                    <p class="correct-word">${currentSession.word}</p>
                </div>
            `;
        }
        
        if (correctGuesses.length > 0) {
            resultsHTML += `
                <div class="winners-box">
                    <h3>🏆 Qaliblər:</h3>
                    <ul class="winners-list">
            `;
            correctGuesses.forEach(guess => {
                resultsHTML += `
                    <li class="winner-item">
                        <span class="winner-name">${guess.userId}</span>
                        <span class="winner-points">+${guess.pointsEarned} xal</span>
                    </li>
                `;
            });
            resultsHTML += `</ul></div>`;
        } else {
            resultsHTML += `
                <div class="no-winners-box">
                    <p>❌ Heç kim düzgün təxmin etmədi</p>
                </div>
            `;
        }
        
        if (allGuesses.length > 0) {
            resultsHTML += `
                <div class="all-guesses-box">
                    <h4>Bütün təxminlər:</h4>
                    <ul class="all-guesses-list">
            `;
            allGuesses.forEach(guess => {
                const isCorrect = guess.isCorrect;
                resultsHTML += `
                    <li class="guess-item ${isCorrect ? 'correct' : 'incorrect'}">
                        <span class="guess-user">${guess.userId}:</span>
                        <span class="guess-text">"${guess.guess}"</span>
                        ${isCorrect ? `<span class="guess-points">+${guess.pointsEarned} xal</span>` : ''}
                    </li>
                `;
            });
            resultsHTML += `</ul></div>`;
        }
        
        timeUpResults.innerHTML = resultsHTML;
    }
}

function closeTimeUpModal() {
    if (timeUpModal) {
        timeUpModal.style.display = "none";
    }
}

function closeNewGameModal() {
    if (newGameModal) {
        newGameModal.style.display = "none";
    }
}

confirmNewGameBtn.addEventListener("click", () => {
    closeTimeUpModal();
    showNewGameConfirmationModal();
});

function showNewGameConfirmationModal() {
    if (newGameModal) {
        newGameModal.style.display = "flex";
    }
}

yesNewGameBtn.addEventListener("click", () => {
    closeNewGameModal();
    closeTimeUpModal();
    resetGame();
});

noNewGameBtn.addEventListener("click", () => {
    closeNewGameModal();
});

async function resetGame() {
    if (timerInterval) clearInterval(timerInterval);
    if (pollingInterval) clearInterval(pollingInterval);
    
    score = 0;
    scoreDisplay.textContent = "0";
    guessesUl.innerHTML = "";
    resultMessage.textContent = "";
    resultMessage.className = "";
    guessInput.disabled = false;
    submitGuessBtn.disabled = false;
    saveDrawingBtn.disabled = false;
    gameEndBox.style.display = "none";
    sessionShareBox.style.display = "none";
    // drawingDisplay is always hidden - we use live canvas instead
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let userId = userIdInput.value.trim();
    
    if (!userId) {
        userId = lastUserId || "user-1";
        userIdInput.value = userId;
    }
    
        // Show drawing section when starting new game (artist)
        if (drawingSection) {
            drawingSection.style.display = "block";
        }
        
        // Hide guessing section for artist
        if (guessingSection) {
            guessingSection.style.display = "none";
        }
        
        // Show players list for artist
        if (playersListSection) {
            playersListSection.style.display = "block";
        }
        
        // Hide viewer canvas for artist
        if (viewerCanvasContainer) {
            viewerCanvasContainer.style.display = "none";
        }
        
        // Update main-content layout for artist (drawing section + players list)
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            mainContent.classList.remove("single-column");
            mainContent.classList.add("artist-only");
        }
        
        // Show new game button for artist
        if (newGameBtn) {
            newGameBtn.style.display = "block";
        }
        
        await startNewGame(userId);
}

if (newGameBtn) {
    newGameBtn.addEventListener("click", () => {
        showNewGameConfirmationModal();
    });
}

if (timeUpModal) {
    timeUpModal.addEventListener("click", (e) => {
        if (e.target === timeUpModal) {
            closeTimeUpModal();
        }
    });
}

if (newGameModal) {
    newGameModal.addEventListener("click", (e) => {
        if (e.target === newGameModal) {
            closeNewGameModal();
        }
    });
}

function showSessionRestartNotification() {
    const notification = document.createElement("div");
    notification.className = "session-restart-notification";
    notification.innerHTML = `
        <div class="notification-content">
            <h3>🔄 Yeni Oyun Başladı!</h3>
            <p>Artist yeni oyun başlatdı. Yeni rəsm tezliklə görünəcək.</p>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Başa düşdüm</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showCorrectAnswerNotification(userId, guess, points) {
    const notification = document.createElement("div");
    notification.className = "session-restart-notification";
    notification.style.backgroundColor = "rgba(76, 175, 80, 0.95)";
    notification.innerHTML = `
        <div class="notification-content">
            <h3>🎉 Düzgün Cavab Tapıldı!</h3>
            <p><strong>${userId}</strong> düzgün təxmin etdi: "<strong>${guess}</strong>"</p>
            <p>+${points} xal qazandı.</p>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Başa düşdüm</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showArtistNextWordModal(newWord) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.style.display = "flex";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h2>🎨 Növbəti Söz</h2>
            <p style="font-size: 18px; margin: 20px 0;">Növbəti söz gəldi! İndi çəkməyə başlaya bilərsiniz.</p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="font-weight: bold; font-size: 24px; text-align: center; margin: 0;">${newWord || 'Yüklənir...'}</p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">Kimisindən seçin və çəkməyə başlayın.</p>
            <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Başa düşdüm</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (modal.parentElement) {
            modal.remove();
        }
    }, 5000);
}

function showNextDrawingNotification() {
    const notification = document.createElement("div");
    notification.className = "session-restart-notification";
    notification.style.backgroundColor = "rgba(33, 150, 243, 0.95)";
    const currentGame = currentSession?.currentGame || 1;
    const maxGames = currentSession?.maxGames || 5;
    notification.innerHTML = `
        <div class="notification-content">
            <h3>🎨 Növbəti Çəkmə</h3>
            <p>Növbəti çəkməyə keçildi. Artist birazdan çəkməyə başlayacaq, kimisindən seçin.</p>
            <p style="font-size: 14px; margin-top: 10px;">Oyun ${currentGame}/${maxGames}</p>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Başa düşdüm</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}

function showTimeUpNoAnswerNotification() {
    const notification = document.createElement("div");
    notification.className = "session-restart-notification";
    notification.style.backgroundColor = "rgba(244, 67, 54, 0.95)";
    notification.innerHTML = `
        <div class="notification-content">
            <h3>⏰ Vaxt Bitdi</h3>
            <p>Siz düzgün cavab verə bilmədiniz.</p>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Başa düşdüm</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}

function showTimeUpFoundAnswerNotification(pointsEarned) {
    const notification = document.createElement("div");
    notification.className = "session-restart-notification";
    notification.style.backgroundColor = "rgba(76, 175, 80, 0.95)";
    notification.innerHTML = `
        <div class="notification-content">
            <h3>⏰ Vaxt Bitdi</h3>
            <p>Təbriklər! Siz düzgün cavab tapdınız və ${pointsEarned} xal qazandınız!</p>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Başa düşdüm</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}

function showCorrectAnswerFoundNotification(pointsEarned) {
    const notification = document.createElement("div");
    notification.className = "session-restart-notification";
    notification.style.backgroundColor = "rgba(76, 175, 80, 0.95)";
    notification.style.zIndex = "10000";
    notification.innerHTML = `
        <div class="notification-content">
            <h3>🎉 Düzgün Tapıldı!</h3>
            <p style="font-size: 18px; margin: 15px 0;">Təbriklər! Siz ${pointsEarned} xal qazandınız!</p>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Başa düşdüm</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

function showPlayerJoinedNotification(newPlayers) {
    const notification = document.createElement("div");
    notification.className = "session-restart-notification";
    notification.style.backgroundColor = "rgba(33, 150, 243, 0.95)";
    const playersText = newPlayers.length === 1 
        ? `<strong>${newPlayers[0]}</strong> oyuna qoşuldu!` 
        : `${newPlayers.length} oyunçu qoşuldu: ${newPlayers.map(p => `<strong>${p}</strong>`).join(', ')}`;
    notification.innerHTML = `
        <div class="notification-content">
            <h3>👥 Yeni Oyunçu Qoşuldu!</h3>
            <p>${playersText}</p>
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Başa düşdüm</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}

function showNextGameNotification() {
    // This function is kept for backward compatibility but now uses specific functions
    // Reset UI for next game
    guessInput.disabled = false;
    submitGuessBtn.disabled = false;
    saveDrawingBtn.disabled = false;
    resultMessage.textContent = "";
    resultMessage.className = "";
    guessesUl.innerHTML = "";
    
    // Clear canvas for artist
    if (isArtist) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        lastSavedDrawing = null;
    }
    
    // Clear viewer canvas for non-artist
    if (!isArtist && viewerCanvas) {
        const viewerCtx = viewerCanvas.getContext("2d");
        viewerCtx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
    }
    
    // Restart timer for new game
    if (currentSession && currentSession.endsAt) {
        const endTime = new Date(currentSession.endsAt);
        startTimer(endTime);
    }
    
    // Update word display for artist
    if (isArtist && currentSession && currentSession.word) {
        wordDisplay.textContent = `Word: ${currentSession.word}`;
        wordDisplay.style.display = "block";
    }
    
    // Update game progress display
    if (currentGameDisplay && currentSession) {
        currentGameDisplay.textContent = currentSession.currentGame || 1;
    }
    if (maxGamesDisplay && currentSession) {
        maxGamesDisplay.textContent = currentSession.maxGames || 5;
    }
    
    // Hide guessing section for artist
    if (isArtist && guessingSection) {
        guessingSection.style.display = "none";
    }
    
    // Show players list for artist
    if (isArtist && playersListSection) {
        playersListSection.style.display = "block";
    }
    
    // Update layout for artist
    if (isArtist) {
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            mainContent.classList.remove("single-column");
            mainContent.classList.add("artist-only");
        }
    }
    
    // Show guessing section for non-artist
    if (!isArtist && guessingSection) {
        guessingSection.style.display = "block";
        // Update layout for non-artist
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            mainContent.classList.remove("artist-only");
            mainContent.classList.add("single-column");
        }
    }
}

function resetToHomePage() {
    // Clear intervals
    if (timerInterval) clearInterval(timerInterval);
    if (pollingInterval) clearInterval(pollingInterval);
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    // Reset game state
    currentSession = null;
    isArtist = false;
    score = 0;
    lastSavedDrawing = null;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (viewerCanvas) {
        const viewerCtx = viewerCanvas.getContext("2d");
        viewerCtx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
    }
    
    // Hide game area
    gameArea.style.display = "none";
    waitingArea.style.display = "none";
    timeUpModal.style.display = "none";
    newGameModal.style.display = "none";
    if (gameCompletedModal) {
        gameCompletedModal.style.display = "none";
    }
    
    // Show header buttons again
    startBtn.style.display = "block";
    startBtn.disabled = false;
    joinBtn.style.display = "block";
    joinSessionIdInput.style.display = "block";
    
    // Show action groups
    const actionGroups = document.querySelectorAll(".action-group");
    actionGroups.forEach(group => {
        group.style.display = "flex";
    });
    const actionDivider = document.querySelector(".action-divider");
    if (actionDivider) {
        actionDivider.style.display = "block";
    }
    
    // Reset UI elements
    guessesUl.innerHTML = "";
    resultMessage.textContent = "";
    resultMessage.className = "";
    scoreDisplay.textContent = "0";
    timerDisplay.textContent = "0";
    wordDisplay.style.display = "none";
    guessInput.disabled = false;
    submitGuessBtn.disabled = false;
    saveDrawingBtn.disabled = false;
    
    // Hide sections
    if (drawingSection) {
        drawingSection.style.display = "none";
    }
    if (viewerCanvasContainer) {
        viewerCanvasContainer.style.display = "none";
    }
    if (sessionShareBox) {
        sessionShareBox.style.display = "none";
    }
    if (gameEndBox) {
        gameEndBox.style.display = "none";
    }
    if (newGameBtn) {
        newGameBtn.style.display = "none";
    }
}

async function showFinalResults(session) {
    // Stop all intervals
    if (pollingInterval) clearInterval(pollingInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    // Disable inputs
    guessInput.disabled = true;
    submitGuessBtn.disabled = true;
    saveDrawingBtn.disabled = true;
    
    // Show game completed modal
    if (gameCompletedModal && gameCompletedResults) {
        gameCompletedModal.style.display = "flex";
        
        const userId = userIdInput.value.trim();
        let resultsHTML = '<div class="final-results-summary">';
        resultsHTML += '<h2>🏆 Final Nəticələr (5 Oyun)</h2>';
        
        // Show total scores
        if (session.totalScores && Object.keys(session.totalScores).length > 0) {
            resultsHTML += '<div class="total-scores-box">';
            resultsHTML += '<h3>📊 Ümumi Xallar:</h3>';
            resultsHTML += '<ul class="total-scores-list">';
            
            const sortedScores = Object.entries(session.totalScores)
                .sort((a, b) => b[1] - a[1]);
            
            sortedScores.forEach(([userId, totalScore], index) => {
                const isCurrentUser = userId === userIdInput.value.trim();
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                resultsHTML += `
                    <li class="total-score-item ${isCurrentUser ? 'current-user' : ''}">
                        <span class="score-rank">${medal} ${index + 1}.</span>
                        <span class="score-user">${userId}</span>
                        <span class="score-total">${totalScore} xal</span>
                    </li>
                `;
            });
            
            resultsHTML += '</ul></div>';
        } else {
            resultsHTML += '<div class="no-scores-box">';
            resultsHTML += '<p>Heç kim xal qazanmadı</p>';
            resultsHTML += '</div>';
        }
        
        // Show game history
        if (session.gameHistory && session.gameHistory.length > 0) {
            resultsHTML += '<div class="game-history-box">';
            resultsHTML += '<h3>📝 Oyun Tarixçəsi:</h3>';
            session.gameHistory.forEach((game, index) => {
                resultsHTML += `
                    <div class="game-history-item">
                        <h4>Oyun ${game.gameNumber}: <strong>${game.word}</strong></h4>
                        <ul class="game-scores-list">
                `;
                if (game.scores && Object.keys(game.scores).length > 0) {
                    Object.entries(game.scores)
                        .sort((a, b) => b[1] - a[1])
                        .forEach(([userId, score]) => {
                            resultsHTML += `<li><strong>${userId}</strong>: +${score} xal</li>`;
                        });
                } else {
                    resultsHTML += '<li>Heç kim xal qazanmadı</li>';
                }
                resultsHTML += '</ul></div>';
            });
            resultsHTML += '</div>';
        }
        
        resultsHTML += '</div>';
        gameCompletedResults.innerHTML = resultsHTML;
        
        // Auto-redirect to home page after 15 seconds (increased from 10)
        setTimeout(() => {
            if (gameCompletedModal && gameCompletedModal.style.display !== 'none') {
                gameCompletedModal.style.display = "none";
                resetToHomePage();
            }
        }, 15000);
    }
}

if (goToHomeBtn) {
    goToHomeBtn.addEventListener("click", () => {
        if (gameCompletedModal) {
            gameCompletedModal.style.display = "none";
        }
        resetToHomePage();
    });
}

if (gameCompletedModal) {
    gameCompletedModal.addEventListener("click", (e) => {
        if (e.target === gameCompletedModal) {
            gameCompletedModal.style.display = "none";
            resetToHomePage();
        }
    });
}

window.joinSession = joinSession;
