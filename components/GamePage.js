"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import Board from "./Board";
import { HeaderWithModeSelect } from "./Header";
import { Toast, useToast } from "./Toast";
import { CongratsModal, LevelCompleteModal } from "./Modal";
import LevelSelectModal from "./LevelSelectModal";
import { WinCelebration, ImpossibleOverlay } from "./GameOverlays";
import { useGame, GAME_STATE } from "@/lib/useGame";
import { createEmptyBoard } from "@/lib/constants";
import { LEVELS } from "@/lib/levels";

/**
 * Unified GamePage component that handles all game modes
 *
 * @param {Object} props
 * @param {"levels" | "random" | "puzzle"} props.mode - Game mode
 * @param {string} props.initialFen - Initial FEN for puzzle mode
 * @param {Object} props.levelData - Level data for campaign mode
 * @param {number} props.currentLevel - Current level number (campaign mode)
 * @param {Set} props.completedLevels - Set of completed level numbers
 * @param {Function} props.onNextLevel - Callback for next level (campaign mode)
 * @param {Function} props.onLevelComplete - Callback when level completed (campaign mode)
 * @param {Function} props.onSelectLevel - Callback when level selected from modal
 * @param {string} props.selectedDifficulty - Difficulty for random mode
 * @param {Function} props.onDifficultyChange - Callback for difficulty change (random mode)
 */
export default function GamePage({
  mode = "random",
  initialFen = null,
  levelData = null,
  currentLevel = 1,
  completedLevels = new Set(),
  onNextLevel,
  onLevelComplete,
  onSelectLevel,
  selectedDifficulty = "easy",
  onDifficultyChange,
  totalLevels = 100,
  isLastLevel = false,
}) {
  const { toast, showToast } = useToast();
  const [showCongrats, setShowCongrats] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [isPlayingSolution, setIsPlayingSolution] = useState(false);
  const [animatingMove, setAnimatingMove] = useState(null);
  const solutionTimeoutRef = useRef(null);
  const usedSolutionRef = useRef(false);

  // For campaign mode, track when a level was just completed to avoid re-triggering
  const [completedLevelNumber, setCompletedLevelNumber] = useState(null);

  // Determine which FEN to use
  const fenToUse = mode === "levels" ? levelData?.fen : initialFen;

  const {
    board,
    gameState,
    moveHistory,
    difficulty,
    puzzleInfo,
    makeMove,
    resetPuzzle,
    newPuzzle,
    getSolution,
  } = useGame(fenToUse, selectedDifficulty);

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
      usedSolutionRef.current = false;
    },
    [newPuzzle, selectedDifficulty]
  );

  // Show celebration on win (but not when solution was used)
  useEffect(() => {
    if (gameState === GAME_STATE.WON && !usedSolutionRef.current) {
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
      usedSolutionRef.current = false;
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
    usedSolutionRef.current = true;

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

  // Handle level selection
  const handleSelectLevel = useCallback(
    (level) => {
      onSelectLevel?.(level);
      setShowLevelSelect(false);
    },
    [onSelectLevel]
  );

  // Calculate progress
  const progressPercent =
    mode === "levels" ? (completedLevels.size / totalLevels) * 100 : 0;

  return (
    <>
      {/* Header with mode selector */}
      <HeaderWithModeSelect />

      {/* Campaign Mode Info */}
      {mode === "levels" && (
        <div className="level-header">
          <button
            className="level-badge"
            onClick={() => setShowLevelSelect(true)}
          >
            <span className="level-number">Level {currentLevel}</span>
            {levelData?.difficulty && (
              <span
                className={`level-difficulty difficulty-${levelData.difficulty}`}
              >
                {levelData.difficulty.replace(/-/g, " ")}
              </span>
            )}
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
              {completedLevels.size}/{totalLevels}
            </span>
          </div>
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
        {gameState === GAME_STATE.WON && !usedSolutionRef.current && (
          <WinCelebration />
        )}
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

        {mode !== "levels" && (
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
        )}

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
          <button
            className="btn btn-primary"
            onClick={() => handleNewPuzzle(difficulty)}
            disabled={isPlayingSolution}
          >
            Next Puzzle
          </button>
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
          solutionCount={puzzleInfo?.metrics?.solutionCount}
          levelNumber={completedLevelNumber}
          isLastLevel={isLastLevel}
        />
      )}

      {showCongrats && mode !== "levels" && (
        <CongratsModal
          onClose={closeCongrats}
          onNextPuzzle={() => {
            closeCongrats();
            handleNewPuzzle(
              mode === "puzzle" ? difficulty : selectedDifficulty
            );
          }}
          moveCount={moveHistory.length}
          solutionCount={puzzleInfo?.metrics?.solutionCount}
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

      <style jsx>
        {`
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
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
          }

          .difficulty-very-easy {
            color: #15803d;
            background: #dcfce7;
          }

          .difficulty-easy {
            color: #0d9488;
            background: #ccfbf1;
          }

          .difficulty-medium {
            color: #b45309;
            background: #fef3c7;
          }

          .difficulty-hard {
            color: #dc2626;
            background: #fee2e2;
          }

          .difficulty-very-hard {
            color: #7c3aed;
            background: #ede9fe;
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
            border: 1px solid var(--surface-200);
            border-radius: 12px;
            padding: 1.25rem;
          }

          .instructions-card-centered {
            text-align: center;
          }

          .instructions-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--surface-800);
            margin: 0 0 0.5rem 0;
          }

          .instructions-text {
            font-size: 0.9375rem;
            color: var(--surface-600);
            line-height: 1.5;
            margin: 0;
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
            .level-header {
              flex-direction: column;
              align-items: stretch;
              gap: 0.75rem;
            }

            .progress-container {
              max-width: none;
            }
          }
        `}
      </style>
    </>
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
