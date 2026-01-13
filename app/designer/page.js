"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { HeaderWithModeSelect } from "@/components/Header";
import GameLayout from "@/components/GameLayout";
import DesignerBoard, { PiecePalette } from "@/components/DesignerBoard";
import Board from "@/components/Board";
import { Toast, useToast } from "@/components/Toast";
import { WinCelebration, ImpossibleOverlay } from "@/components/GameOverlays";
import { createEmptyBoard, PIECE_IMAGES } from "@/lib/constants";
import { boardToFen, fenToUrl, countPieces } from "@/lib/fen";
import { isSolvable, getPuzzleMetrics } from "@/lib/solver";
import { getDifficultyLevel } from "@/lib/generator";
import { useGame, GAME_STATE } from "@/lib/useGame";

/**
 * Designer Mode - Create and share your own puzzles
 */
export default function DesignerPage() {
  const { toast, showToast } = useToast();
  const [board, setBoard] = useState(createEmptyBoard);
  const [analysis, setAnalysis] = useState({
    status: "need-pieces",
    message: "Place at least 2 pieces",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Test play mode state
  const [testPlayMode, setTestPlayMode] = useState(false);
  const [testPlayFen, setTestPlayFen] = useState(null);

  // Drag and drop state
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragSize, setDragSize] = useState(80);
  const boardRef = useRef(null);

  // Count pieces on the board
  const pieceCount = useMemo(() => countPieces(board), [board]);

  // Game state for test play mode
  const {
    board: gameBoard,
    gameState,
    moveHistory,
    makeMove,
    resetPuzzle,
    getSolution,
  } = useGame(testPlayFen, null);

  // Solution playback state
  const [isPlayingSolution, setIsPlayingSolution] = useState(false);
  const [animatingMove, setAnimatingMove] = useState(null);
  const solutionTimeoutRef = useRef(null);
  const makeMoveRef = useRef(makeMove);

  useEffect(() => {
    makeMoveRef.current = makeMove;
  }, [makeMove]);

  // Cleanup solution timeouts
  useEffect(() => {
    return () => {
      if (solutionTimeoutRef.current) {
        clearTimeout(solutionTimeoutRef.current);
      }
    };
  }, []);

  // Analyze the puzzle whenever the board changes
  useEffect(() => {
    if (pieceCount < 2) {
      setAnalysis({
        status: "need-pieces",
        message: "Place at least 2 pieces",
      });
      return;
    }

    setIsAnalyzing(true);

    // Use setTimeout to avoid blocking the UI
    const timeoutId = setTimeout(() => {
      try {
        const solvable = isSolvable(board);

        if (solvable) {
          const metrics = getPuzzleMetrics(board);
          const difficulty = getDifficultyLevel(metrics.weightedDifficulty);
          setAnalysis({
            status: "solvable",
            message: "Solvable!",
            difficulty,
            score: metrics.weightedDifficulty,
            solutionCount: metrics.solutionCount,
            minMoves: metrics.minMoves,
          });
        } else {
          setAnalysis({
            status: "unsolvable",
            message: "Not solvable",
          });
        }
      } catch (e) {
        console.error("Analysis error:", e);
        setAnalysis({
          status: "error",
          message: "Analysis failed",
        });
      }
      setIsAnalyzing(false);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [board, pieceCount]);

  // Handle board changes
  const handleBoardChange = useCallback((newBoard) => {
    setBoard(newBoard);
  }, []);

  // Clear the board
  const handleClear = useCallback(() => {
    setBoard(createEmptyBoard());
  }, []);

  // Copy share URL to clipboard
  const handleShare = useCallback(async () => {
    if (analysis?.status !== "solvable") {
      showToast("Puzzle must be solvable to share!", "error");
      return;
    }

    const fen = boardToFen(board);
    const urlFen = fenToUrl(fen);
    const shareUrl = `${window.location.origin}/puzzle/${urlFen}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied to clipboard!", "success");
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToast("Link copied to clipboard!", "success");
    }
  }, [board, analysis, showToast]);

  // Test play the puzzle
  const handleTestPlay = useCallback(() => {
    if (pieceCount < 2) {
      showToast("Place at least 2 pieces first!", "error");
      return;
    }

    const fen = boardToFen(board);
    setTestPlayFen(fen);
    setTestPlayMode(true);
  }, [board, pieceCount, showToast]);

  // Exit test play and go back to editing
  const handleBackToEdit = useCallback(() => {
    setTestPlayMode(false);
    setTestPlayFen(null);
    setIsPlayingSolution(false);
    setAnimatingMove(null);
    if (solutionTimeoutRef.current) {
      clearTimeout(solutionTimeoutRef.current);
    }
  }, []);

  // Handle move in test play mode
  const handleMove = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      const success = makeMove(fromRow, fromCol, toRow, toCol);
      if (!success) {
        showToast("Invalid move! Every move must capture a piece.", "error");
      }
    },
    [makeMove, showToast]
  );

  // Show solution with animation
  const handleShowSolution = useCallback(() => {
    const solution = getSolution();
    if (!solution || solution.length === 0) {
      showToast("No solution found!", "error");
      return;
    }

    resetPuzzle();
    setIsPlayingSolution(true);

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

  // --- Drag and Drop Logic ---

  // Convert pixel position to board coordinates
  const positionToSquare = useCallback((x, y) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();

    // Check if outside board bounds
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      return null;
    }

    const squareSize = rect.width / 4;
    const col = Math.floor((x - rect.left) / squareSize);
    const row = Math.floor((y - rect.top) / squareSize);

    if (row >= 0 && row < 4 && col >= 0 && col < 4) {
      return { row, col };
    }
    return null;
  }, []);

  const handleDragStart = useCallback((dragInfo, eventOrTouch) => {
    setDraggingPiece(dragInfo);
    setDragPosition({
      x: eventOrTouch.clientX,
      y: eventOrTouch.clientY,
    });

    if (boardRef.current) {
      setDragSize(boardRef.current.offsetWidth / 4);
    }
  }, []);

  const handleDragMove = useCallback(
    (clientX, clientY) => {
      if (draggingPiece) {
        setDragPosition({ x: clientX, y: clientY });
      }
    },
    [draggingPiece]
  );

  const handleDragEnd = useCallback(
    (clientX, clientY) => {
      if (!draggingPiece) return;

      const targetSquare = positionToSquare(clientX, clientY);

      if (targetSquare) {
        // Dropped on board
        const newBoard = [...board.map((row) => [...row])];

        // If moving from board, remove from old position
        if (draggingPiece.type === "board") {
          newBoard[draggingPiece.row][draggingPiece.col] = null;
        }

        // Place piece at new position
        newBoard[targetSquare.row][targetSquare.col] = draggingPiece.piece;

        handleBoardChange(newBoard);
      } else {
        // Dropped off board
        if (draggingPiece.type === "board") {
          // Remove piece
          const newBoard = [...board.map((row) => [...row])];
          newBoard[draggingPiece.row][draggingPiece.col] = null;
          handleBoardChange(newBoard);
        }
        // If from palette, just do nothing (cancel)
      }

      setDraggingPiece(null);
    },
    [draggingPiece, board, handleBoardChange, positionToSquare]
  );

  // Global event listeners for drag
  useEffect(() => {
    if (draggingPiece) {
      const onMouseMove = (e) => handleDragMove(e.clientX, e.clientY);
      const onMouseUp = (e) => handleDragEnd(e.clientX, e.clientY);
      const onTouchMove = (e) => {
        if (e.touches.length === 1) {
          e.preventDefault(); // Prevent scrolling
          handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      };
      const onTouchEnd = (e) => {
        if (e.changedTouches.length === 1) {
          handleDragEnd(
            e.changedTouches[0].clientX,
            e.changedTouches[0].clientY
          );
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      };
    }
  }, [draggingPiece, handleDragMove, handleDragEnd]);

  // Get analysis status display
  const getAnalysisDisplay = () => {
    if (isAnalyzing) {
      return {
        icon: "⏳",
        text: "Analyzing...",
        className: "status-analyzing",
      };
    }

    if (!analysis) return null;

    switch (analysis.status) {
      case "need-pieces":
        return {
          icon: "📝",
          text: analysis.message,
          className: "status-info",
        };
      case "solvable":
        return {
          icon: "✓",
          text: analysis.message,
          className: "status-solvable",
          difficulty: analysis.difficulty,
          details: `${analysis.solutionCount} solution${
            analysis.solutionCount !== 1 ? "s" : ""
          } • ${analysis.minMoves} moves`,
        };
      case "unsolvable":
        return {
          icon: "✗",
          text: analysis.message,
          className: "status-unsolvable",
        };
      case "error":
        return {
          icon: "⚠️",
          text: analysis.message,
          className: "status-error",
        };
      default:
        return null;
    }
  };

  const analysisDisplay = getAnalysisDisplay();

  // Display board for test play mode
  const displayBoard = gameBoard || createEmptyBoard();

  return (
    <GameLayout>
      <HeaderWithModeSelect />

      {testPlayMode ? (
        <>
          {/* Test Play Mode */}
          <div className="test-play-header">
            <span className="test-play-badge">Testing Puzzle</span>
          </div>

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

          {/* Test Play Controls */}
          <div className="controls">
            <button
              className="btn"
              onClick={resetPuzzle}
              disabled={moveHistory.length === 0 || isPlayingSolution}
            >
              <ResetIcon />
              Reset
            </button>
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
            <button className="btn btn-primary" onClick={handleBackToEdit}>
              <EditIcon />
              Back to Edit
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Designer Mode */}
          {/* Piece Palette */}
          <PiecePalette onPieceDragStart={handleDragStart} />

          {/* Board */}
          <div className="board-section">
            <DesignerBoard
              ref={boardRef}
              board={board}
              onBoardChange={handleBoardChange}
              onPieceDragStart={handleDragStart}
              draggingPiece={draggingPiece}
            />
          </div>

          {/* Dragging Overlay */}
          {draggingPiece && (
            <div
              className="dragging-piece-overlay"
              style={{
                left: dragPosition.x,
                top: dragPosition.y,
                width: dragSize,
                height: dragSize,
              }}
            >
              <img
                src={PIECE_IMAGES[draggingPiece.piece]}
                alt={draggingPiece.piece}
              />
            </div>
          )}

          {/* Analysis Status */}
          {analysisDisplay && (
            <div className={`analysis-card ${analysisDisplay.className}`}>
              <div className="analysis-main">
                <span className="analysis-icon">{analysisDisplay.icon}</span>
                <span className="analysis-text">{analysisDisplay.text}</span>
                {analysisDisplay.difficulty && (
                  <span
                    className={`difficulty-badge difficulty-${analysisDisplay.difficulty}`}
                  >
                    {analysisDisplay.difficulty
                      .replace(/-/g, " ")
                      .replace(/^\w/, (c) => c.toUpperCase())}
                  </span>
                )}
              </div>
              {analysisDisplay.details && (
                <div className="analysis-details">
                  {analysisDisplay.details}
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="controls">
            <button
              className="btn"
              onClick={handleClear}
              disabled={pieceCount === 0}
            >
              <TrashIcon />
              Clear
            </button>
            <button
              className="btn"
              onClick={handleTestPlay}
              disabled={pieceCount < 2}
            >
              <PlayIcon />
              Test Play
            </button>
            <button
              className="btn btn-primary"
              onClick={handleShare}
              disabled={analysis?.status !== "solvable"}
            >
              <ShareIcon />
              Share
            </button>
          </div>
        </>
      )}

      <Toast toast={toast} />
    </GameLayout>
  );
}

// Icon components
function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 18, height: 18, marginRight: 6 }}
    >
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 18, height: 18, marginRight: 6 }}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 18, height: 18, marginRight: 6 }}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
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

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 18, height: 18, marginRight: 6 }}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
