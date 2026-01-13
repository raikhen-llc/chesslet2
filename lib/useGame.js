"use client";

import { useState, useCallback, useEffect } from "react";
import { fenToBoard, boardToFen, cloneBoard, countPieces } from "./fen";
import {
  isValidCapture,
  executeCapture,
  isSolved,
  isStuck,
  getAllValidMoves,
} from "./engine";
import { isSolvable, getHint, solvePuzzle } from "./solver";
import {
  generatePuzzle,
  evaluatePuzzle,
  getStarterPuzzle,
  DIFFICULTY,
} from "./generator";

/**
 * Game states
 */
export const GAME_STATE = {
  PLAYING: "playing",
  WON: "won",
  STUCK: "stuck",
  IMPOSSIBLE: "impossible",
};

/**
 * Custom hook for managing Chesslet game state
 * @param {string} initialFen - Optional initial FEN position
 * @returns {Object} Game state and actions
 */
export function useGame(initialFen = null, defaultDifficulty = null) {
  // Compute all initial values synchronously in a single place
  // This avoids issues with useState initializers not having access to other state
  const initialValues = (() => {
    if (initialFen) {
      try {
        const parsedBoard = fenToBoard(initialFen);
        const evaluation = evaluatePuzzle(parsedBoard);
        return {
          board: parsedBoard,
          initialBoard: cloneBoard(parsedBoard),
          puzzleInfo: evaluation,
          difficulty: evaluation.difficulty,
          gameState: evaluation.solvable
            ? GAME_STATE.PLAYING
            : GAME_STATE.IMPOSSIBLE,
        };
      } catch {
        return {
          board: null,
          initialBoard: null,
          puzzleInfo: null,
          difficulty: null,
          gameState: GAME_STATE.PLAYING,
        };
      }
    }
    return {
      board: null,
      initialBoard: null,
      puzzleInfo: null,
      difficulty: null,
      gameState: GAME_STATE.PLAYING,
    };
  })();

  const [board, setBoard] = useState(initialValues.board);
  const [initialBoard, setInitialBoard] = useState(initialValues.initialBoard);
  const [puzzleInfo, setPuzzleInfo] = useState(initialValues.puzzleInfo);
  const [difficulty, setDifficulty] = useState(initialValues.difficulty);
  const [gameState, setGameState] = useState(initialValues.gameState);
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  // Generate puzzle if no initial FEN provided (only runs once on mount)
  useEffect(() => {
    if (!initialFen) {
      newPuzzle(defaultDifficulty);
    }
  }, []);

  /**
   * Load a puzzle from FEN
   */
  const loadPuzzle = useCallback((fen) => {
    try {
      const newBoard = fenToBoard(fen);
      const evaluation = evaluatePuzzle(newBoard);

      setBoard(newBoard);
      setInitialBoard(cloneBoard(newBoard));
      setMoveHistory([]);
      setLastMove(null);
      setDifficulty(evaluation.difficulty);
      setPuzzleInfo(evaluation);

      if (!evaluation.solvable) {
        setGameState(GAME_STATE.IMPOSSIBLE);
      } else {
        setGameState(GAME_STATE.PLAYING);
      }
    } catch (err) {
      console.error("Failed to load puzzle:", err);
      // Load a default puzzle instead
      newPuzzle();
    }
  }, []);

  // Re-load puzzle when initialFen changes (e.g., when entering test play mode)
  useEffect(() => {
    if (initialFen) {
      loadPuzzle(initialFen);
    }
  }, [initialFen, loadPuzzle]);

  /**
   * Generate a new random puzzle
   */
  const newPuzzle = useCallback((targetDifficulty = null) => {
    // Try to generate a puzzle, fallback to starter puzzle
    let puzzle = generatePuzzle({
      difficulty: targetDifficulty,
      minPieces: 3,
      maxPieces: 6,
      maxAttempts: 50,
    });

    if (!puzzle) {
      // Fallback to starter puzzle
      const starter = getStarterPuzzle(targetDifficulty);
      puzzle = {
        fen: starter.fen,
        board: fenToBoard(starter.fen),
        difficulty: starter.difficulty,
        ...evaluatePuzzle(fenToBoard(starter.fen)),
      };
    } else {
      // Ensure solvable property is present (generatePuzzle guarantees it's solvable)
      puzzle.solvable = true;
    }

    setBoard(puzzle.board);
    setInitialBoard(cloneBoard(puzzle.board));
    setMoveHistory([]);
    setLastMove(null);
    setDifficulty(puzzle.difficulty);
    setPuzzleInfo(puzzle);
    setGameState(GAME_STATE.PLAYING);

    return puzzle.fen;
  }, []);

  /**
   * Make a move
   */
  const makeMove = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      if (gameState !== GAME_STATE.PLAYING) return false;

      // Validate the move
      if (!isValidCapture(board, fromRow, fromCol, toRow, toCol)) {
        return false;
      }

      // Execute the capture
      const newBoard = executeCapture(board, fromRow, fromCol, toRow, toCol);
      const move = {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        capturedPiece: board[toRow][toCol],
        movingPiece: board[fromRow][fromCol],
      };

      setBoard(newBoard);
      setMoveHistory((prev) => [...prev, move]);
      setLastMove(move);

      // Check game state
      if (isSolved(newBoard)) {
        setGameState(GAME_STATE.WON);
      } else if (isStuck(newBoard)) {
        setGameState(GAME_STATE.STUCK);
      }

      return true;
    },
    [board, gameState]
  );

  /**
   * Undo the last move
   */
  const undoMove = useCallback(() => {
    if (moveHistory.length === 0) return false;

    const newHistory = [...moveHistory];
    const lastMoveToUndo = newHistory.pop();

    // Reconstruct board state by replaying moves
    let currentBoard = cloneBoard(initialBoard);
    for (const move of newHistory) {
      currentBoard = executeCapture(
        currentBoard,
        move.from.row,
        move.from.col,
        move.to.row,
        move.to.col
      );
    }

    setBoard(currentBoard);
    setMoveHistory(newHistory);
    setLastMove(
      newHistory.length > 0 ? newHistory[newHistory.length - 1] : null
    );
    setGameState(GAME_STATE.PLAYING);

    return true;
  }, [moveHistory, initialBoard]);

  /**
   * Reset to initial position
   */
  const resetPuzzle = useCallback(() => {
    if (!initialBoard) return;

    setBoard(cloneBoard(initialBoard));
    setMoveHistory([]);
    setLastMove(null);
    setGameState(
      puzzleInfo?.solvable ? GAME_STATE.PLAYING : GAME_STATE.IMPOSSIBLE
    );
  }, [initialBoard, puzzleInfo]);

  /**
   * Get a hint
   */
  const requestHint = useCallback(() => {
    if (gameState !== GAME_STATE.PLAYING) return null;
    return getHint(board);
  }, [board, gameState]);

  /**
   * Get the full solution from the initial board state
   * Returns an array of moves that solve the puzzle
   */
  const getSolution = useCallback(() => {
    if (!initialBoard) return null;
    const result = solvePuzzle(initialBoard, {
      findAll: false,
      maxSolutions: 1,
    });
    if (result.solvable && result.solutions.length > 0) {
      return result.solutions[0];
    }
    return null;
  }, [initialBoard]);

  /**
   * Get current FEN
   */
  const getCurrentFen = useCallback(() => {
    return board ? boardToFen(board) : null;
  }, [board]);

  /**
   * Get valid moves count
   */
  const getValidMovesCount = useCallback(() => {
    if (!board) return 0;
    return getAllValidMoves(board).length;
  }, [board]);

  return {
    // State
    board,
    gameState,
    moveHistory,
    lastMove,
    difficulty,
    puzzleInfo,
    piecesRemaining: board ? countPieces(board) : 0,
    validMovesCount: getValidMovesCount(),

    // Actions
    makeMove,
    undoMove,
    resetPuzzle,
    newPuzzle,
    loadPuzzle,
    requestHint,
    getSolution,
    getCurrentFen,

    // Constants
    GAME_STATE,
    DIFFICULTY,
  };
}
