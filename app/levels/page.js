"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Board from "@/components/Board";
import { HeaderWithNav } from "@/components/Header";
import { Toast, useToast } from "@/components/Toast";
import { LevelCompleteModal } from "@/components/Modal";
import LevelSelectModal from "@/components/LevelSelectModal";
import { WinCelebration } from "@/components/GameOverlays";
import { useGame, GAME_STATE } from "@/lib/useGame";
import { LEVELS, TOTAL_LEVELS, getLevel } from "@/lib/levels";
import { createEmptyBoard } from "@/lib/constants";

/**
 * Main Levels page - Campaign mode with 100 levels
 */
export default function LevelsPage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState(new Set());
  const [showCongrats, setShowCongrats] = useState(false);
  const [completedLevelNumber, setCompletedLevelNumber] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem("chesslet-progress");
    if (savedProgress) {
      try {
        const { level, completed } = JSON.parse(savedProgress);
        setCurrentLevel(level || 1);
        setCompletedLevels(new Set(completed || []));
      } catch (e) {
        console.error("Failed to load progress:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        "chesslet-progress",
        JSON.stringify({
          level: currentLevel,
          completed: Array.from(completedLevels),
        })
      );
    }
  }, [currentLevel, completedLevels, isLoaded]);

  // Get current level data
  const levelData = getLevel(currentLevel);

  const { board, gameState, moveHistory, makeMove, resetPuzzle, loadPuzzle } =
    useGame(levelData?.fen);

  // Reload puzzle when level changes
  useEffect(() => {
    if (levelData && isLoaded) {
      loadPuzzle(levelData.fen);
    }
  }, [currentLevel, isLoaded]);

  const displayBoard = board || createEmptyBoard();

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

  // Handle level completion
  useEffect(() => {
    if (gameState === GAME_STATE.WON && completedLevelNumber !== currentLevel) {
      setCompletedLevels((prev) => new Set([...prev, currentLevel]));
      setCompletedLevelNumber(currentLevel);
      setShowCongrats(true);
    } else if (gameState === GAME_STATE.STUCK) {
      showToast("No valid moves left. Try undoing or reset!", "warning");
    }
  }, [gameState, currentLevel, completedLevelNumber, showToast]);

  // Go to next level
  const handleNextLevel = useCallback(() => {
    if (currentLevel < TOTAL_LEVELS) {
      setCompletedLevelNumber(null);
      setCurrentLevel(currentLevel + 1);
      setShowCongrats(false);
    }
  }, [currentLevel]);

  // Jump to a specific level
  const handleSelectLevel = useCallback((level) => {
    setCompletedLevelNumber(null);
    setCurrentLevel(level);
    setShowLevelSelect(false);
  }, []);

  // Close congratulations modal
  const closeCongrats = useCallback(() => {
    setShowCongrats(false);
  }, []);

  // Calculate progress percentage
  const progressPercent = (completedLevels.size / TOTAL_LEVELS) * 100;

  if (!isLoaded) {
    return (
      <div className="page-container">
        <div className="loading-section">
          <div className="loading-spinner" />
          <p className="loading-text">Loading levels...</p>
        </div>

        <style jsx>{`
          .page-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .loading-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
          }

          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid var(--surface-200);
            border-top-color: var(--accent-500);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          .loading-text {
            color: var(--surface-500);
            font-size: 1rem;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Header */}
        <HeaderWithNav navHref="/" navLabel="Random Mode" />

        {/* Level Info */}
        <div className="level-header">
          <button
            className="level-badge"
            onClick={() => setShowLevelSelect(true)}
          >
            <span className="level-number">Level {currentLevel}</span>
            <span className="level-difficulty">{levelData?.difficulty}</span>
            <ChevronDownIcon />
          </button>

          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="progress-text">
              {completedLevels.size}/{TOTAL_LEVELS}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions-card">
          <p className="instructions-text">
            Capture your own pieces until there's only one remaining!
          </p>
        </div>

        {/* Board */}
        <div className="board-section">
          <Board
            board={displayBoard}
            onMove={handleMove}
            disabled={gameState !== GAME_STATE.PLAYING}
          />

          {/* Win celebration overlay */}
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

          {currentLevel > 1 && (
            <button
              className="btn"
              onClick={() => {
                setCompletedLevelNumber(null);
                setCurrentLevel(currentLevel - 1);
              }}
            >
              <ChevronLeftIcon />
              Prev
            </button>
          )}

          {currentLevel < TOTAL_LEVELS && (
            <button className="btn" onClick={handleNextLevel}>
              Skip
              <ChevronRightIcon />
            </button>
          )}
        </div>

        {/* Toast */}
        <Toast toast={toast} />

        {/* Congratulations Modal */}
        {showCongrats && completedLevelNumber && (
          <LevelCompleteModal
            onClose={closeCongrats}
            onNextLevel={handleNextLevel}
            moveCount={moveHistory.length}
            levelNumber={completedLevelNumber}
            isLastLevel={completedLevelNumber >= TOTAL_LEVELS}
          />
        )}

        {/* Level Select Modal */}
        {showLevelSelect && (
          <LevelSelectModal
            levels={LEVELS}
            currentLevel={currentLevel}
            completedLevels={completedLevels}
            onSelectLevel={handleSelectLevel}
            onClose={() => setShowLevelSelect(false)}
          />
        )}
      </div>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 2rem 1.5rem;
          padding-top: 3rem;
        }

        .content-wrapper {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .level-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .level-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          border: 1px solid var(--surface-200);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .level-badge:hover {
          border-color: var(--accent-300);
          background: var(--accent-50);
        }

        .level-number {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--surface-800);
        }

        .level-difficulty {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--surface-500);
          background: var(--surface-100);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          max-width: 200px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: var(--surface-200);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--accent-400),
            var(--accent-500)
          );
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--surface-600);
          white-space: nowrap;
        }

        .instructions-card {
          background: white;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          border: 1px solid var(--surface-200);
        }

        .instructions-text {
          font-size: 0.9375rem;
          color: var(--surface-600);
          line-height: 1.5;
          margin: 0;
          text-align: center;
        }

        .board-section {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .controls {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        @media (max-width: 520px) {
          .page-container {
            padding: 1.5rem 1rem;
            padding-top: 2rem;
          }

          .level-header {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .progress-container {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}

// Icon components
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

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 16, height: 16, color: "var(--surface-400)" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 18, height: 18, marginRight: 6 }}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 18, height: 18, marginLeft: 6 }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
