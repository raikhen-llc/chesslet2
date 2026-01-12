"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Board from "./Board";
import { HeaderWithNav } from "./Header";
import { Toast, useToast } from "./Toast";
import { CongratsModal, LevelCompleteModal } from "./Modal";
import { WinCelebration, ImpossibleOverlay } from "./GameOverlays";
import { useGame, GAME_STATE } from "@/lib/useGame";
import { createEmptyBoard } from "@/lib/constants";

/**
 * Unified GamePage component that handles all game modes
 *
 * @param {Object} props
 * @param {"levels" | "random" | "puzzle"} props.mode - Game mode
 * @param {string} props.initialFen - Initial FEN for puzzle mode
 * @param {Object} props.levelData - Level data for campaign mode
 * @param {number} props.currentLevel - Current level number (campaign mode)
 * @param {Function} props.onNextLevel - Callback for next level (campaign mode)
 * @param {Function} props.onLevelComplete - Callback when level completed (campaign mode)
 * @param {string} props.selectedDifficulty - Difficulty for random mode
 * @param {Function} props.onDifficultyChange - Callback for difficulty change (random mode)
 */
export default function GamePage({
  mode = "random",
  initialFen = null,
  levelData = null,
  currentLevel = 1,
  onNextLevel,
  onLevelComplete,
  selectedDifficulty = "easy",
  onDifficultyChange,
  totalLevels = 100,
  isLastLevel = false,
}) {
  const { toast, showToast } = useToast();
  const [showCongrats, setShowCongrats] = useState(false);
  const [isPlayingSolution, setIsPlayingSolution] = useState(false);
  const [animatingMove, setAnimatingMove] = useState(null);
  const solutionTimeoutRef = useRef(null);

  // For campaign mode, track when a level was just completed to avoid re-triggering
  const [completedLevelNumber, setCompletedLevelNumber] = useState(null);

  // Determine which FEN to use
  const fenToUse = mode === "levels" ? levelData?.fen : initialFen;

  const {
    board,
    gameState,
    moveHistory,
    difficulty,
    makeMove,
    resetPuzzle,
    newPuzzle,
    getSolution,
  } = useGame(fenToUse);

  // Keep a ref to the latest makeMove for solution playback
  const makeMoveRef = useRef(makeMove);
  useEffect(() => {
    makeMoveRef.current = makeMove;
  }, [makeMove]);

  // Use empty board as fallback only if board isn't ready yet
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

  // Handle new puzzle (random mode)
  const handleNewPuzzle = useCallback(
    (targetDifficulty) => {
      newPuzzle(targetDifficulty || selectedDifficulty);
      setShowCongrats(false);
    },
    [newPuzzle, selectedDifficulty]
  );

  // Show celebration on win
  useEffect(() => {
    if (gameState === GAME_STATE.WON) {
      if (mode === "levels") {
        // Campaign mode - only trigger once per level
        if (completedLevelNumber !== currentLevel) {
          setCompletedLevelNumber(currentLevel);
          setShowCongrats(true);
          onLevelComplete?.(currentLevel);
        }
      } else {
        setShowCongrats(true);
      }
    } else if (gameState === GAME_STATE.STUCK) {
      showToast("No valid moves left. Try undoing or reset!", "warning");
    }
  }, [
    gameState,
    mode,
    currentLevel,
    completedLevelNumber,
    showToast,
    onLevelComplete,
  ]);

  // Reset completedLevelNumber when level changes (campaign mode)
  useEffect(() => {
    if (mode === "levels") {
      setCompletedLevelNumber(null);
    }
  }, [currentLevel, mode]);

  // Close congratulations modal
  const closeCongrats = useCallback(() => {
    setShowCongrats(false);
  }, []);

  // Handle show solution with animation
  const handleShowSolution = useCallback(() => {
    const solution = getSolution();
    if (!solution || solution.length === 0) {
      showToast("No solution found!", "error");
      return;
    }

    // Reset to initial state first
    resetPuzzle();
    setIsPlayingSolution(true);
    setShowCongrats(false);

    // Play each move with animation
    let moveIndex = 0;
    const playNextMove = () => {
      if (moveIndex >= solution.length) {
        setIsPlayingSolution(false);
        setAnimatingMove(null);
        return;
      }

      const move = solution[moveIndex];
      setAnimatingMove(move);

      solutionTimeoutRef.current = setTimeout(() => {
        makeMoveRef.current(
          move.from.row,
          move.from.col,
          move.to.row,
          move.to.col
        );
        setAnimatingMove(null);
        moveIndex++;

        solutionTimeoutRef.current = setTimeout(playNextMove, 300);
      }, 600);
    };

    solutionTimeoutRef.current = setTimeout(playNextMove, 200);
  }, [getSolution, resetPuzzle, showToast]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (solutionTimeoutRef.current) {
        clearTimeout(solutionTimeoutRef.current);
      }
    };
  }, []);

  // Handle next level (campaign mode)
  const handleNextLevel = useCallback(() => {
    setShowCongrats(false);
    onNextLevel?.();
  }, [onNextLevel]);

  // Determine nav link based on mode
  const getNavConfig = () => {
    switch (mode) {
      case "levels":
        return { href: "/", label: "Random Mode" };
      case "random":
        return { href: "/", label: "← Home" };
      case "puzzle":
        return { href: "/", label: "← Home" };
      default:
        return { href: "/", label: "Home" };
    }
  };

  const navConfig = getNavConfig();

  return (
    <div className="game-page">
      {/* Header */}
      <HeaderWithNav navHref={navConfig.href} navLabel={navConfig.label} />

      {/* Mode-specific info section */}
      {mode === "random" && (
        <div className="info-section">
          <div className="instructions-card">
            <h2 className="instructions-title">Random Mode</h2>
            <p className="instructions-text">
              Capture pieces until only one remains!
            </p>
          </div>

          <div className="difficulty-wrapper">
            <label className="difficulty-label">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => onDifficultyChange?.(e.target.value)}
              className="difficulty-select"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      )}

      {mode === "puzzle" && (
        <div className="instructions-card instructions-card-centered">
          <h2 className="instructions-title">How to play</h2>
          <p className="instructions-text">
            Capture your own pieces until there's only one remaining. Every move
            must be a capture!
          </p>
        </div>
      )}

      {/* Board Section */}
      <div className="board-section">
        <Board
          board={displayBoard}
          onMove={handleMove}
          disabled={gameState !== GAME_STATE.PLAYING || isPlayingSolution}
          animatingMove={animatingMove}
        />

        {/* Overlays */}
        {gameState === GAME_STATE.IMPOSSIBLE && <ImpossibleOverlay />}
        {gameState === GAME_STATE.WON && <WinCelebration />}
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          className="btn"
          onClick={resetPuzzle}
          disabled={moveHistory.length === 0 || isPlayingSolution}
        >
          <ResetIcon />
          Reset
        </button>

        {mode === "random" && (
          <button
            className="btn btn-primary"
            onClick={() => handleNewPuzzle(selectedDifficulty)}
            disabled={isPlayingSolution}
          >
            <NewPuzzleIcon />
            New Puzzle
          </button>
        )}

        {mode === "puzzle" && (
          <>
            <button
              className="btn"
              onClick={handleShowSolution}
              disabled={
                gameState === GAME_STATE.IMPOSSIBLE ||
                gameState === GAME_STATE.WON ||
                isPlayingSolution
              }
            >
              {isPlayingSolution ? "Playing..." : "Show Solution"}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleNewPuzzle(difficulty)}
              disabled={isPlayingSolution}
            >
              Next Puzzle
            </button>
          </>
        )}

        {mode === "levels" && (
          <button
            className="btn btn-primary"
            onClick={handleNextLevel}
            disabled={isPlayingSolution || isLastLevel}
          >
            Skip
            <ChevronRightIcon />
          </button>
        )}
      </div>

      {/* Toast */}
      <Toast toast={toast} />

      {/* Modals */}
      {showCongrats && mode === "levels" && completedLevelNumber && (
        <LevelCompleteModal
          onClose={closeCongrats}
          onNextLevel={handleNextLevel}
          moveCount={moveHistory.length}
          levelNumber={completedLevelNumber}
          isLastLevel={isLastLevel}
        />
      )}

      {showCongrats && mode !== "levels" && (
        <CongratsModal
          onClose={closeCongrats}
          onNextPuzzle={() => {
            closeCongrats();
            handleNewPuzzle(mode === "puzzle" ? difficulty : selectedDifficulty);
          }}
          moveCount={moveHistory.length}
        />
      )}

      <style jsx>{`
        .game-page {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-section {
          display: flex;
          flex-direction: row;
          gap: 1.25rem;
          align-items: stretch;
        }

        .instructions-card {
          flex: 1;
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          border: 1px solid var(--surface-200);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .instructions-card-centered {
          text-align: center;
        }

        .instructions-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--surface-700);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: "DM Sans", sans-serif;
        }

        .instructions-text {
          font-size: 0.9375rem;
          color: var(--surface-600);
          line-height: 1.5;
          margin: 0;
        }

        .difficulty-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-width: 130px;
        }

        .difficulty-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--surface-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .difficulty-select {
          width: 100%;
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
          .info-section {
            flex-direction: column;
            gap: 1rem;
          }

          .difficulty-wrapper {
            width: 100%;
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
      className="btn-icon"
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

function NewPuzzleIcon() {
  return (
    <svg
      className="btn-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 18, height: 18, marginRight: 6 }}
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="btn-icon-right"
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
