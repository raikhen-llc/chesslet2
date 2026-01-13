"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Board from "@/components/Board";
import { HeaderWithModeSelect } from "@/components/Header";
import { Toast, useToast } from "@/components/Toast";
import { WinCelebration } from "@/components/GameOverlays";
import { useGame, GAME_STATE } from "@/lib/useGame";
import { generatePuzzle, DIFFICULTY } from "@/lib/generator";
import { createEmptyBoard } from "@/lib/constants";
import GameLayout from "@/components/GameLayout";

const GAME_DURATION = 60; // seconds

/**
 * Get difficulty based on number of puzzles solved
 * Progressive difficulty: Easy -> Medium -> Hard
 */
function getDifficultyForScore(score) {
  if (score < 3) return DIFFICULTY.EASY;
  if (score < 6) return DIFFICULTY.MEDIUM;
  return DIFFICULTY.HARD;
}

/**
 * Timed Mode - Solve as many puzzles as you can in 60 seconds
 */
export default function TimedPage() {
  const { toast, showToast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  // Game state
  const [gamePhase, setGamePhase] = useState("ready"); // ready, playing, finished
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [highScore, setHighScore] = useState(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Refs
  const timerRef = useRef(null);
  const puzzleStartTimeRef = useRef(null);
  const scoreRef = useRef(score);

  // Sync score ref
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chesslet-timed-highscore");
    if (saved) {
      try {
        const { score } = JSON.parse(saved);
        setHighScore(score);
      } catch (e) {
        console.error("Failed to load high score:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Generate a new puzzle
  const generateNewPuzzle = useCallback((currentScore) => {
    const difficulty = getDifficultyForScore(currentScore);
    const puzzle = generatePuzzle({
      difficulty,
      minPieces:
        difficulty === DIFFICULTY.EASY
          ? 2
          : difficulty === DIFFICULTY.MEDIUM
          ? 3
          : 4,
      maxPieces:
        difficulty === DIFFICULTY.EASY
          ? 4
          : difficulty === DIFFICULTY.MEDIUM
          ? 6
          : 8,
      maxAttempts: 50,
    });

    if (puzzle) {
      setCurrentPuzzle(puzzle);
      puzzleStartTimeRef.current = Date.now();
    }

    return puzzle;
  }, []);

  // Initialize game hook with current puzzle
  const { board, gameState, moveHistory, makeMove, resetPuzzle, loadPuzzle } =
    useGame(currentPuzzle?.fen);

  // Load puzzle when it changes
  useEffect(() => {
    if (currentPuzzle && gamePhase === "playing") {
      loadPuzzle(currentPuzzle.fen);
    }
  }, [currentPuzzle, gamePhase, loadPuzzle]);

  // Start the game
  const startGame = useCallback(() => {
    setGamePhase("playing");
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setIsNewHighScore(false);
    generateNewPuzzle(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGamePhase("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [generateNewPuzzle]);

  // Handle puzzle completion
  useEffect(() => {
    if (gameState === GAME_STATE.WON && gamePhase === "playing") {
      const newScore = scoreRef.current + 1;
      setScore(newScore);

      // Small delay before next puzzle for feedback
      setTimeout(() => {
        if (gamePhase === "playing") {
          generateNewPuzzle(newScore);
        }
      }, 300);
    }
  }, [gameState, gamePhase, generateNewPuzzle]);

  // Handle game end - save high score
  useEffect(() => {
    if (gamePhase === "finished") {
      if (highScore === null || score > highScore) {
        setHighScore(score);
        setIsNewHighScore(true);
        localStorage.setItem(
          "chesslet-timed-highscore",
          JSON.stringify({ score, date: new Date().toISOString() })
        );
      }
    }
  }, [gamePhase, score, highScore]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle move
  const handleMove = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      const success = makeMove(fromRow, fromCol, toRow, toCol);
      if (!success) {
        showToast("Invalid move! Every move must capture a piece.", "error");
      }
    },
    [makeMove, showToast]
  );

  // Skip current puzzle
  const handleSkip = useCallback(() => {
    if (gamePhase === "playing") {
      generateNewPuzzle(score);
    }
  }, [gamePhase, score, generateNewPuzzle]);

  const displayBoard = board || createEmptyBoard();

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate timer progress
  const timerProgress = (timeLeft / GAME_DURATION) * 100;
  const isLowTime = timeLeft <= 10;

  return (
    <GameLayout>
      <HeaderWithModeSelect />

      {/* Ready Screen */}
      {gamePhase === "ready" && (
        <div className="ready-screen">
          <div className="ready-card">
            <div className="ready-icon">⏱️</div>
            <h2 className="ready-title">Timed Mode</h2>
            <p className="ready-description">
              Solve as many puzzles as you can in 60 seconds! Difficulty
              increases as you progress.
            </p>
            <div className="high-score-display">
              <span className="high-score-label">Best Score</span>
              <span className="high-score-value">
                {highScore !== null ? highScore : "--"}
              </span>
            </div>
            <button className="btn btn-primary btn-large" onClick={startGame}>
              <PlayIcon />
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Playing Screen */}
      {gamePhase === "playing" && (
        <>
          {/* Timer and Score Bar */}
          <div className="game-stats">
            <div className="timer-section">
              <div className={`timer ${isLowTime ? "timer-low" : ""}`}>
                <TimerIcon />
                <span className="timer-value">{formatTime(timeLeft)}</span>
              </div>
              <div className="timer-bar">
                <div
                  className={`timer-fill ${isLowTime ? "timer-fill-low" : ""}`}
                  style={{ width: `${timerProgress}%` }}
                />
              </div>
            </div>

            <div className="score-section">
              <span className="score-label">Score</span>
              <span className="score-value">{score}</span>
            </div>
          </div>

          {/* Board */}
          <div className="board-section">
            <Board
              board={displayBoard}
              onMove={handleMove}
              disabled={gameState !== GAME_STATE.PLAYING}
            />
            {gameState === GAME_STATE.WON && <WinCelebration />}
          </div>

          {/* Controls */}
          <div className="controls">
            <button
              className="btn"
              onClick={resetPuzzle}
              disabled={moveHistory.length === 0}
            >
              <ResetIcon />
              Reset
            </button>
            <button className="btn" onClick={handleSkip}>
              <SkipIcon />
              Skip
            </button>
          </div>
        </>
      )}

      {/* Finished Screen */}
      {gamePhase === "finished" && (
        <div className="finished-screen">
          <div className="finished-card">
            <div className="finished-icon">{isNewHighScore ? "🏆" : "⏱️"}</div>
            <h2 className="finished-title">
              {isNewHighScore ? "New High Score!" : "Time's Up!"}
            </h2>
            <div className="final-score">
              <span className="final-score-label">Puzzles Solved</span>
              <span className="final-score-value">{score}</span>
            </div>
            {highScore !== null && !isNewHighScore && (
              <div className="best-score-info">Best: {highScore}</div>
            )}
            <button className="btn btn-primary btn-large" onClick={startGame}>
              <PlayIcon />
              Play Again
            </button>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </GameLayout>
  );
}

// Icon components
function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: 20, height: 20, marginRight: 8 }}
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 20, height: 20 }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 18, height: 18, marginRight: 6 }}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 18, height: 18, marginRight: 6 }}
    >
      <path d="M5 4l10 8-10 8V4z" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}
