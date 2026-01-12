/**
 * Puzzle Solver for Chesslet
 *
 * Uses recursive backtracking to:
 * 1. Determine if a puzzle is solvable
 * 2. Find all solutions
 * 3. Calculate solution depth and branching factor
 */

import { getAllValidMoves, executeCapture, isSolved } from "./engine.js";
import { cloneBoard, countPieces } from "./fen.js";

/**
 * Result of solving a puzzle
 * @typedef {Object} SolveResult
 * @property {boolean} solvable - Whether the puzzle has a solution
 * @property {Array<Array<{from: {row: number, col: number}, to: {row: number, col: number}}>>} solutions - All solutions found
 * @property {number} minMoves - Minimum moves to solve (if solvable)
 * @property {number} maxMoves - Maximum moves to solve (if solvable)
 * @property {number} solutionCount - Number of distinct solutions
 * @property {number} deadEnds - Number of dead-end paths
 * @property {number} totalBranches - Total branching explored
 */

/**
 * Solve a puzzle using recursive backtracking
 * @param {Array<Array<string|null>>} board - Initial board state
 * @param {Object} options - Solver options
 * @param {boolean} options.findAll - Whether to find all solutions (default: false, stops at first)
 * @param {number} options.maxSolutions - Maximum solutions to find (default: 100)
 * @returns {SolveResult}
 */
export function solvePuzzle(board, options = {}) {
  const { findAll = false, maxSolutions = 100 } = options;

  const solutions = [];
  let deadEnds = 0;
  let totalBranches = 0;

  function solve(currentBoard, moves) {
    // Check if we've found enough solutions
    if (solutions.length >= maxSolutions) return;

    // Check if solved
    if (isSolved(currentBoard)) {
      solutions.push([...moves]);
      return;
    }

    // Get all valid moves
    const validMoves = getAllValidMoves(currentBoard);
    totalBranches += validMoves.length;

    // Dead end - no valid moves but not solved
    if (validMoves.length === 0) {
      deadEnds++;
      return;
    }

    // Try each move
    for (const move of validMoves) {
      // Stop if we found a solution and don't need all
      if (!findAll && solutions.length > 0) return;

      const newBoard = executeCapture(
        currentBoard,
        move.from.row,
        move.from.col,
        move.to.row,
        move.to.col
      );

      solve(newBoard, [...moves, { from: move.from, to: move.to }]);
    }
  }

  solve(cloneBoard(board), []);

  return {
    solvable: solutions.length > 0,
    solutions,
    minMoves:
      solutions.length > 0 ? Math.min(...solutions.map((s) => s.length)) : 0,
    maxMoves:
      solutions.length > 0 ? Math.max(...solutions.map((s) => s.length)) : 0,
    solutionCount: solutions.length,
    deadEnds,
    totalBranches,
  };
}

/**
 * Quick check if a puzzle is solvable (stops at first solution)
 * @param {Array<Array<string|null>>} board
 * @returns {boolean}
 */
export function isSolvable(board) {
  const result = solvePuzzle(board, { findAll: false, maxSolutions: 1 });
  return result.solvable;
}

/**
 * Get a hint for the next move
 * Returns the first move of a valid solution path
 * @param {Array<Array<string|null>>} board
 * @returns {{from: {row: number, col: number}, to: {row: number, col: number}} | null}
 */
export function getHint(board) {
  const result = solvePuzzle(board, { findAll: false, maxSolutions: 1 });

  if (result.solvable && result.solutions[0].length > 0) {
    return result.solutions[0][0];
  }

  return null;
}

/**
 * Check if a specific move keeps the puzzle solvable
 * @param {Array<Array<string|null>>} board
 * @param {number} fromRow
 * @param {number} fromCol
 * @param {number} toRow
 * @param {number} toCol
 * @returns {boolean}
 */
export function moveKeepsSolvable(board, fromRow, fromCol, toRow, toCol) {
  const newBoard = executeCapture(board, fromRow, fromCol, toRow, toCol);

  // If only one piece left, it's solved
  if (isSolved(newBoard)) return true;

  return isSolvable(newBoard);
}

/**
 * Analyze all possible moves and categorize them
 * @param {Array<Array<string|null>>} board
 * @returns {{winning: Array, losing: Array}}
 */
export function analyzeMoves(board) {
  const allMoves = getAllValidMoves(board);
  const winning = [];
  const losing = [];

  for (const move of allMoves) {
    const newBoard = executeCapture(
      board,
      move.from.row,
      move.from.col,
      move.to.row,
      move.to.col
    );

    if (isSolved(newBoard) || isSolvable(newBoard)) {
      winning.push(move);
    } else {
      losing.push(move);
    }
  }

  return { winning, losing };
}

/**
 * Calculate puzzle metrics for difficulty evaluation
 * @param {Array<Array<string|null>>} board
 * @returns {Object}
 */
export function getPuzzleMetrics(board) {
  const pieceCount = countPieces(board);
  const result = solvePuzzle(board, { findAll: true, maxSolutions: 1000 });
  const initialMoves = getAllValidMoves(board);

  // Count how many initial moves lead to solutions vs dead ends
  let goodFirstMoves = 0;
  let badFirstMoves = 0;

  for (const move of initialMoves) {
    if (
      moveKeepsSolvable(
        board,
        move.from.row,
        move.from.col,
        move.to.row,
        move.to.col
      )
    ) {
      goodFirstMoves++;
    } else {
      badFirstMoves++;
    }
  }

  // Get new weighted difficulty metrics
  const difficultyMetrics = calculateWeightedDifficulty(board);

  return {
    pieceCount,
    solvable: result.solvable,
    solutionCount: result.solutionCount,
    minMoves: result.minMoves,
    maxMoves: result.maxMoves,
    deadEnds: result.deadEnds,
    totalBranches: result.totalBranches,
    initialMoveCount: initialMoves.length,
    goodFirstMoves,
    badFirstMoves,
    trapRatio:
      initialMoves.length > 0 ? badFirstMoves / initialMoves.length : 0,
    // New weighted difficulty metrics
    ...difficultyMetrics,
  };
}

/**
 * Calculate weighted difficulty based on solution paths and piece change intuitiveness
 *
 * Core idea:
 * - Explore ALL possible move sequences
 * - Weight each path by intuitiveness (fewer piece changes = more intuitive = higher weight)
 * - Difficulty = 1 - (weighted solutions / weighted total paths)
 *
 * Weighting uses exponential decay: weight = β^pieceChanges
 * This ensures linear solutions (0 piece changes) strongly dominate the weighted sum,
 * making puzzles with any linear solution significantly easier.
 *
 * @param {Array<Array<string|null>>} board
 * @returns {Object}
 */

// Decay factor for piece changes: lower = stronger emphasis on linear solutions
// At 0.2: linear=1.0, 1 change=0.2, 2 changes=0.04, 3 changes=0.008
const PIECE_CHANGE_DECAY = 0.2;

export function calculateWeightedDifficulty(board) {
  const allPaths = [];

  /**
   * Recursively explore all possible paths
   * @param {Array<Array<string|null>>} currentBoard
   * @param {Array<{piece: string, from: Object, to: Object}>} path - Current path of moves
   * @param {string|null} lastCapturingPiece - The piece that made the last capture
   * @param {number} pieceChanges - Number of times the capturing piece changed
   */
  function explorePaths(currentBoard, path, lastCapturingPiece, pieceChanges) {
    // Check if solved (only one piece left)
    if (isSolved(currentBoard)) {
      allPaths.push({
        path: [...path],
        pieceChanges,
        isSolution: true,
        length: path.length,
      });
      return;
    }

    // Get all valid moves
    const validMoves = getAllValidMoves(currentBoard);

    // Dead end - no valid moves but not solved
    if (validMoves.length === 0) {
      allPaths.push({
        path: [...path],
        pieceChanges,
        isSolution: false,
        length: path.length,
      });
      return;
    }

    // Try each move
    for (const move of validMoves) {
      const capturingPiece = currentBoard[move.from.row][move.from.col];

      // Count piece change if this is a different piece than the last one
      const newPieceChanges =
        lastCapturingPiece !== null && capturingPiece !== lastCapturingPiece
          ? pieceChanges + 1
          : pieceChanges;

      const newBoard = executeCapture(
        currentBoard,
        move.from.row,
        move.from.col,
        move.to.row,
        move.to.col
      );

      explorePaths(
        newBoard,
        [...path, { piece: capturingPiece, from: move.from, to: move.to }],
        capturingPiece,
        newPieceChanges
      );
    }
  }

  // Start exploration
  explorePaths(cloneBoard(board), [], null, 0);

  // Calculate weights and totals
  // Weight formula: β^pieceChanges - exponential decay ensures linear paths dominate
  let totalWeightedPaths = 0;
  let totalWeightedSolutions = 0;
  let totalPaths = allPaths.length;
  let totalSolutions = 0;
  let minPieceChangesForSolution = Infinity;
  let maxPieceChangesForSolution = 0;

  for (const pathInfo of allPaths) {
    // Exponential decay: linear paths (0 changes) get weight 1, others decay rapidly
    const weight = Math.pow(PIECE_CHANGE_DECAY, pathInfo.pieceChanges);
    totalWeightedPaths += weight;

    if (pathInfo.isSolution) {
      totalWeightedSolutions += weight;
      totalSolutions++;
      minPieceChangesForSolution = Math.min(
        minPieceChangesForSolution,
        pathInfo.pieceChanges
      );
      maxPieceChangesForSolution = Math.max(
        maxPieceChangesForSolution,
        pathInfo.pieceChanges
      );
    }
  }

  // Weighted solution ratio: what proportion of weighted paths lead to solutions
  const weightedSolutionRatio =
    totalWeightedPaths > 0 ? totalWeightedSolutions / totalWeightedPaths : 0;

  // Raw solution ratio (for comparison)
  const rawSolutionRatio = totalPaths > 0 ? totalSolutions / totalPaths : 0;

  // Difficulty: inverse of weighted solution ratio
  // Scale to 0-100 where 100 is hardest
  const weightedDifficulty = Math.round((1 - weightedSolutionRatio) * 100);

  return {
    weightedDifficulty,
    weightedSolutionRatio,
    rawSolutionRatio,
    totalPaths,
    totalSolutions,
    totalWeightedPaths,
    totalWeightedSolutions,
    minPieceChangesForSolution:
      totalSolutions > 0 ? minPieceChangesForSolution : null,
    maxPieceChangesForSolution:
      totalSolutions > 0 ? maxPieceChangesForSolution : null,
  };
}
