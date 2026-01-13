/**
 * Puzzle Generator for Chesslet
 *
 * Generates random solvable puzzles and evaluates their difficulty.
 */

import { createEmptyBoard, boardToFen, countPieces } from "./fen.js";
import { isSolvable, getPuzzleMetrics } from "./solver.js";
import { getAllValidMoves } from "./engine.js";
import { PIECES, BOARD_SIZE } from "./constants.js";

/**
 * Difficulty levels
 */
export const DIFFICULTY = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
};

/**
 * Generate a random board with the specified number of pieces
 * @param {number} pieceCount - Number of pieces to place (2-16)
 * @returns {Array<Array<string|null>>}
 */
function generateRandomBoard(pieceCount) {
  const board = createEmptyBoard();
  const positions = [];

  // Generate all possible positions
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push({ row, col });
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Place pieces
  for (let i = 0; i < Math.min(pieceCount, positions.length); i++) {
    const { row, col } = positions[i];
    const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
    board[row][col] = piece;
  }

  return board;
}

/**
 * Calculate difficulty score for a puzzle
 *
 * New system based on:
 * - What percentage of all possible move sequences lead to a solution?
 * - Weighted by intuitiveness (fewer piece changes = more intuitive = higher weight)
 *
 * @param {Object} metrics - Puzzle metrics from getPuzzleMetrics
 * @returns {number} Difficulty score (0-100)
 */
function calculateDifficultyScore(metrics) {
  if (!metrics.solvable) return -1;

  // Use the new weighted difficulty directly
  // This is already 0-100 where 100 = hardest (no intuitive solutions)
  return metrics.weightedDifficulty;
}

/**
 * Determine difficulty level from score
 * @param {number} score
 * @returns {string}
 */
export function getDifficultyLevel(score) {
  if (score < 30) return DIFFICULTY.EASY;
  if (score < 60) return DIFFICULTY.MEDIUM;
  return DIFFICULTY.HARD;
}

/**
 * Generate a solvable puzzle
 * @param {Object} options
 * @param {number} options.minPieces - Minimum pieces (default: 2)
 * @param {number} options.maxPieces - Maximum pieces (default: 8)
 * @param {string} options.difficulty - Target difficulty (optional)
 * @param {number} options.maxAttempts - Maximum generation attempts (default: 100)
 * @returns {{board: Array<Array<string|null>>, fen: string, difficulty: string, score: number, metrics: Object} | null}
 */
export function generatePuzzle(options = {}) {
  const {
    minPieces = 2,
    maxPieces = 8,
    difficulty = null,
    maxAttempts = 100,
  } = options;

  let bestPuzzle = null;
  let bestScoreDiff = Infinity;

  // Target score ranges for each difficulty
  const targetRanges = {
    [DIFFICULTY.EASY]: { min: 0, max: 29, target: 15 },
    [DIFFICULTY.MEDIUM]: { min: 30, max: 59, target: 45 },
    [DIFFICULTY.HARD]: { min: 60, max: 100, target: 80 },
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Random piece count within range
    const pieceCount =
      Math.floor(Math.random() * (maxPieces - minPieces + 1)) + minPieces;
    const board = generateRandomBoard(pieceCount);

    // Check if solvable
    if (!isSolvable(board)) continue;

    // Get metrics and calculate difficulty
    const metrics = getPuzzleMetrics(board);
    const score = calculateDifficultyScore(metrics);
    const level = getDifficultyLevel(score);

    const puzzle = {
      board,
      fen: boardToFen(board),
      difficulty: level,
      score,
      metrics,
    };

    // If no difficulty target, return first solvable puzzle
    if (!difficulty) {
      return puzzle;
    }

    // Check if this matches target difficulty
    const range = targetRanges[difficulty];
    if (score >= range.min && score <= range.max) {
      const scoreDiff = Math.abs(score - range.target);
      if (scoreDiff < bestScoreDiff) {
        bestScoreDiff = scoreDiff;
        bestPuzzle = puzzle;
      }
    }

    // Found a perfect match
    if (bestScoreDiff === 0) break;
  }

  return bestPuzzle;
}

/**
 * Generate multiple puzzles with increasing difficulty
 * @param {number} count - Number of puzzles to generate
 * @returns {Array}
 */
export function generatePuzzleSet(count) {
  const puzzles = [];
  const difficulties = [DIFFICULTY.EASY, DIFFICULTY.MEDIUM, DIFFICULTY.HARD];

  for (let i = 0; i < count; i++) {
    // Gradually increase difficulty
    const targetDifficulty =
      difficulties[Math.min(Math.floor(i / (count / 3)), 2)];

    const puzzle = generatePuzzle({
      difficulty: targetDifficulty,
      minPieces:
        targetDifficulty === DIFFICULTY.EASY
          ? 2
          : targetDifficulty === DIFFICULTY.MEDIUM
          ? 4
          : 5,
      maxPieces:
        targetDifficulty === DIFFICULTY.EASY
          ? 4
          : targetDifficulty === DIFFICULTY.MEDIUM
          ? 6
          : 8,
      maxAttempts: 200,
    });

    if (puzzle) {
      puzzles.push(puzzle);
    }
  }

  return puzzles;
}

/**
 * Evaluate difficulty of an existing puzzle (from FEN)
 * @param {Array<Array<string|null>>} board
 * @returns {{difficulty: string, score: number, metrics: Object, solvable: boolean}}
 */
export function evaluatePuzzle(board) {
  const metrics = getPuzzleMetrics(board);
  const score = calculateDifficultyScore(metrics);

  return {
    difficulty: metrics.solvable ? getDifficultyLevel(score) : null,
    score: metrics.solvable ? score : -1,
    metrics,
    solvable: metrics.solvable,
  };
}

/**
 * Pre-generated starter puzzles for quick loading
 * These are known-good puzzles with varying difficulties
 */
export const STARTER_PUZZLES = [
  // Easy puzzles (2-3 pieces)
  { fen: "K3/4/4/3Q", difficulty: DIFFICULTY.EASY },
  { fen: "R3/4/4/R3", difficulty: DIFFICULTY.EASY },
  { fen: "N3/4/1N2/4", difficulty: DIFFICULTY.EASY },
  { fen: "Q3/4/4/3P", difficulty: DIFFICULTY.EASY },

  // Medium puzzles (3-4 pieces)
  { fen: "RB2/4/4/2QK", difficulty: DIFFICULTY.MEDIUM },
  { fen: "N2B/4/K3/3R", difficulty: DIFFICULTY.MEDIUM },
  { fen: "Q3/2N1/4/B2K", difficulty: DIFFICULTY.MEDIUM },
  { fen: "K2R/4/2B1/N3", difficulty: DIFFICULTY.MEDIUM },

  // Hard puzzles (5+ pieces)
  { fen: "QRNB/4/4/PPKP", difficulty: DIFFICULTY.HARD },
  { fen: "K2Q/NB2/2R1/P2P", difficulty: DIFFICULTY.HARD },
  { fen: "RNB1/P3/2Q1/K2P", difficulty: DIFFICULTY.HARD },
  { fen: "QKRB/P3/2N1/3P", difficulty: DIFFICULTY.HARD },
];

/**
 * Get a random starter puzzle by difficulty
 * @param {string} difficulty
 * @returns {{fen: string, difficulty: string}}
 */
export function getStarterPuzzle(difficulty = null) {
  let filtered = STARTER_PUZZLES;

  if (difficulty) {
    filtered = STARTER_PUZZLES.filter((p) => p.difficulty === difficulty);
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}
