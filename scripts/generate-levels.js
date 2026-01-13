#!/usr/bin/env node

/**
 * Generate 100 puzzles of increasing difficulty for Chesslet
 *
 * Usage: node scripts/generate-levels.js
 *
 * Features:
 * - Weighted piece selection (favors P/N/K over Q/R)
 * - Timeout protection (5 min max)
 * - Hill climbing for hard puzzles
 * - Adaptive filtering
 */

import {
  createEmptyBoard,
  boardToFen,
  countPieces,
  fenToBoard,
  cloneBoard,
} from "../lib/fen.js";
import { isSolvable, getPuzzleMetrics } from "../lib/solver.js";
import { getAllValidMoves } from "../lib/engine.js";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BOARD_SIZE = 4;
const TARGET_LEVELS = 100;

// Total timeout: 5 minutes
const TOTAL_TIMEOUT_MS = 5 * 60 * 1000;
const startTime = Date.now();

/**
 * Weighted piece selection - favor low-mobility pieces for harder puzzles
 * Pawns: diagonal-only captures, very limited
 * Knights: L-shape, often blocked
 * Kings: single square movement
 * Bishops: moderate (diagonal sliding)
 * Rooks: high mobility
 * Queens: too powerful, trivializes puzzles
 */
const PIECE_WEIGHTS = {
  P: 3.0,
  N: 2.5,
  K: 2.0,
  B: 1.0,
  R: 0.5,
  Q: 0.2,
};

// Precompute total weight and cumulative weights for fast sampling
const PIECES_WEIGHTED = Object.entries(PIECE_WEIGHTS);
const TOTAL_WEIGHT = PIECES_WEIGHTED.reduce((sum, [, w]) => sum + w, 0);

/**
 * Select a random piece using weighted probabilities
 */
function weightedRandomPiece() {
  let random = Math.random() * TOTAL_WEIGHT;
  for (const [piece, weight] of PIECES_WEIGHTED) {
    random -= weight;
    if (random <= 0) return piece;
  }
  return "P"; // Fallback
}

/**
 * Check if we've exceeded the total timeout
 */
function isTimedOut() {
  return Date.now() - startTime >= TOTAL_TIMEOUT_MS;
}

/**
 * Get remaining time in ms
 */
function getRemainingTime() {
  return Math.max(0, TOTAL_TIMEOUT_MS - (Date.now() - startTime));
}

/**
 * Generate a random board with weighted piece selection
 */
function generateRandomBoard(pieceCount) {
  const board = createEmptyBoard();
  const positions = [];

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

  // Place pieces with weighted selection
  for (let i = 0; i < Math.min(pieceCount, positions.length); i++) {
    const { row, col } = positions[i];
    const piece = weightedRandomPiece();
    board[row][col] = piece;
  }

  return board;
}

/**
 * Generate a solvable random puzzle
 */
function generateRandomSolvablePuzzle(minPieces, maxPieces, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    if (isTimedOut()) return null;

    const pieceCount =
      Math.floor(Math.random() * (maxPieces - minPieces + 1)) + minPieces;
    const board = generateRandomBoard(pieceCount);

    if (isSolvable(board)) {
      return board;
    }
  }
  return null;
}

/**
 * Evaluate a board and return puzzle info
 */
function evaluateBoard(board) {
  if (!isSolvable(board)) return null;

  const metrics = getPuzzleMetrics(board);
  return {
    board,
    fen: boardToFen(board),
    score: metrics.weightedDifficulty,
    pieceCount: countPieces(board),
    solutionCount: metrics.solutionCount,
    minMoves: metrics.minMoves,
    minPieceChanges: metrics.minPieceChangesForSolution,
  };
}

/**
 * Mutate a board for hill climbing
 */
function mutateBoard(board) {
  const newBoard = cloneBoard(board);
  const mutations = [
    swapTwoPieces,
    movePieceToEmpty,
    changePieceType,
    addPiece,
    removePiece,
  ];

  const mutation = mutations[Math.floor(Math.random() * mutations.length)];
  return mutation(newBoard);
}

function swapTwoPieces(board) {
  const pieces = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) {
        pieces.push({ row, col });
      }
    }
  }

  if (pieces.length < 2) return board;

  const i = Math.floor(Math.random() * pieces.length);
  let j = Math.floor(Math.random() * pieces.length);
  while (j === i) j = Math.floor(Math.random() * pieces.length);

  const temp = board[pieces[i].row][pieces[i].col];
  board[pieces[i].row][pieces[i].col] = board[pieces[j].row][pieces[j].col];
  board[pieces[j].row][pieces[j].col] = temp;

  return board;
}

function movePieceToEmpty(board) {
  const pieces = [];
  const empty = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) {
        pieces.push({ row, col });
      } else {
        empty.push({ row, col });
      }
    }
  }

  if (pieces.length === 0 || empty.length === 0) return board;

  const fromIdx = Math.floor(Math.random() * pieces.length);
  const toIdx = Math.floor(Math.random() * empty.length);

  const piece = board[pieces[fromIdx].row][pieces[fromIdx].col];
  board[pieces[fromIdx].row][pieces[fromIdx].col] = null;
  board[empty[toIdx].row][empty[toIdx].col] = piece;

  return board;
}

function changePieceType(board) {
  const pieces = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) {
        pieces.push({ row, col });
      }
    }
  }

  if (pieces.length === 0) return board;

  const idx = Math.floor(Math.random() * pieces.length);
  // Use weighted selection favoring low-mobility pieces
  board[pieces[idx].row][pieces[idx].col] = weightedRandomPiece();

  return board;
}

function addPiece(board) {
  const empty = [];
  let pieceCount = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) {
        pieceCount++;
      } else {
        empty.push({ row, col });
      }
    }
  }

  // Don't add if already at max (8 pieces)
  if (empty.length === 0 || pieceCount >= 8) return board;

  const idx = Math.floor(Math.random() * empty.length);
  board[empty[idx].row][empty[idx].col] = weightedRandomPiece();

  return board;
}

function removePiece(board) {
  const pieces = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) {
        pieces.push({ row, col });
      }
    }
  }

  // Don't remove if only 2 pieces left
  if (pieces.length <= 2) return board;

  const idx = Math.floor(Math.random() * pieces.length);
  board[pieces[idx].row][pieces[idx].col] = null;

  return board;
}

/**
 * Hill climbing with random restarts to find hard puzzles
 */
function hillClimbForHardPuzzle(
  timeoutMs,
  minPieces,
  maxPieces,
  minScore = 70
) {
  const localStartTime = Date.now();
  let globalBest = null;
  let attempts = 0;
  let improvements = 0;

  while (Date.now() - localStartTime < timeoutMs && !isTimedOut()) {
    attempts++;

    // Random restart
    const startBoard = generateRandomSolvablePuzzle(minPieces, maxPieces, 50);
    if (!startBoard) continue;

    let current = startBoard;
    let currentInfo = evaluateBoard(current);
    if (!currentInfo) continue;

    // Local search (up to 50 iterations per restart)
    for (let i = 0; i < 50; i++) {
      if (isTimedOut()) break;

      const neighbor = mutateBoard(cloneBoard(current));
      const neighborInfo = evaluateBoard(neighbor);

      if (neighborInfo && neighborInfo.score > currentInfo.score) {
        current = neighbor;
        currentInfo = neighborInfo;
        improvements++;
      }
    }

    // Update global best
    if (!globalBest || currentInfo.score > globalBest.score) {
      globalBest = currentInfo;

      // Early exit if we found a really good one
      if (globalBest.score >= 95) break;
    }
  }

  return globalBest;
}

/**
 * Generate a puzzle with specific constraints and timeout
 */
function generatePuzzleWithTimeout(options = {}) {
  const {
    minPieces = 2,
    maxPieces = 8,
    targetScore = null,
    scoreRange = 15,
    timeoutMs = 30000,
    useHillClimbing = false,
  } = options;

  const localStartTime = Date.now();
  let bestPuzzle = null;
  let bestScoreDiff = Infinity;

  // For hard puzzles, try hill climbing first
  if (useHillClimbing && targetScore >= 70) {
    const hillClimbTime = Math.min(timeoutMs * 0.7, 20000);
    const result = hillClimbForHardPuzzle(
      hillClimbTime,
      minPieces,
      maxPieces,
      targetScore
    );
    if (result && result.score >= targetScore * 0.8) {
      bestPuzzle = result;
      bestScoreDiff = Math.abs(result.score - targetScore);
    }
  }

  // Random search for remaining time
  while (Date.now() - localStartTime < timeoutMs && !isTimedOut()) {
    const pieceCount =
      Math.floor(Math.random() * (maxPieces - minPieces + 1)) + minPieces;
    const board = generateRandomBoard(pieceCount);

    if (!isSolvable(board)) continue;

    const metrics = getPuzzleMetrics(board);
    const score = metrics.weightedDifficulty;

    const puzzle = {
      fen: boardToFen(board),
      score,
      pieceCount,
      solutionCount: metrics.solutionCount,
      minMoves: metrics.minMoves,
      minPieceChanges: metrics.minPieceChangesForSolution,
    };

    if (targetScore === null) {
      return puzzle;
    }

    const scoreDiff = Math.abs(score - targetScore);

    // Accept if better than current best and within acceptable range
    if (score >= targetScore * 0.8 && scoreDiff < bestScoreDiff) {
      bestScoreDiff = scoreDiff;
      bestPuzzle = puzzle;
    }

    // Perfect match - stop early
    if (bestScoreDiff <= 2) break;
  }

  return bestPuzzle;
}

/**
 * Generate puzzles for a specific difficulty range with timeout
 */
function generatePuzzlesForRange(
  count,
  minScore,
  maxScore,
  minPieces,
  maxPieces,
  options = {}
) {
  const {
    phaseTimeoutMs = 50000,
    scoreRange = 15,
    useHillClimbing = false,
  } = options;

  const puzzles = [];
  const usedFens = new Set();
  const phaseStartTime = Date.now();
  const perPuzzleTimeout = Math.floor(phaseTimeoutMs / count);

  for (let i = 0; i < count; i++) {
    if (isTimedOut() || Date.now() - phaseStartTime >= phaseTimeoutMs) {
      console.log(
        `\n  ⚠️  Timeout reached, got ${puzzles.length}/${count} puzzles`
      );
      break;
    }

    const progress = i / count;
    const targetScore = minScore + (maxScore - minScore) * progress;

    let puzzle = null;
    let attempts = 0;
    const remainingPhaseTime = phaseTimeoutMs - (Date.now() - phaseStartTime);
    const puzzleTimeout = Math.min(
      perPuzzleTimeout * 2,
      remainingPhaseTime / (count - i)
    );

    while (!puzzle && attempts < 5 && !isTimedOut()) {
      puzzle = generatePuzzleWithTimeout({
        minPieces,
        maxPieces,
        targetScore,
        scoreRange,
        timeoutMs: puzzleTimeout,
        useHillClimbing,
      });

      // Ensure uniqueness
      if (puzzle && usedFens.has(puzzle.fen)) {
        puzzle = null;
      }
      attempts++;
    }

    if (puzzle) {
      usedFens.add(puzzle.fen);
      puzzles.push(puzzle);
      process.stdout.write(
        `\r  Generated ${puzzles.length}/${count} (target: ${Math.round(
          targetScore
        )}, got: ${puzzle.score})`
      );
    }
  }

  console.log("");
  return puzzles;
}

/**
 * Main generation function
 */
async function main() {
  console.log("🎮 Chesslet Level Generator v2");
  console.log("================================");
  console.log(
    `Generating ${TARGET_LEVELS} puzzles with increasing difficulty...`
  );
  console.log(`Max runtime: ${TOTAL_TIMEOUT_MS / 1000}s`);
  console.log(`Using weighted piece selection (P/N/K favored)\n`);

  const allPuzzles = [];

  // Phase timeouts (total ~4.5 min to leave buffer)
  const PHASE_TIMEOUT = 50000; // 50s per phase

  // Phase 1: Very Easy (score 0-25, 2-4 pieces)
  console.log("📦 Phase 1: Very Easy (Levels 1-20)");
  if (!isTimedOut()) {
    const veryEasy = generatePuzzlesForRange(20, 0, 25, 2, 4, {
      phaseTimeoutMs: PHASE_TIMEOUT,
      scoreRange: 20,
    });
    allPuzzles.push(...veryEasy);
  }

  // Phase 2: Easy (score 20-45, 3-5 pieces)
  console.log("📦 Phase 2: Easy (Levels 21-40)");
  if (!isTimedOut()) {
    const easy = generatePuzzlesForRange(20, 20, 45, 3, 5, {
      phaseTimeoutMs: PHASE_TIMEOUT,
      scoreRange: 20,
    });
    allPuzzles.push(...easy);
  }

  // Phase 3: Medium (score 40-65, 4-6 pieces)
  console.log("📦 Phase 3: Medium (Levels 41-60)");
  if (!isTimedOut()) {
    const medium = generatePuzzlesForRange(20, 40, 65, 4, 6, {
      phaseTimeoutMs: PHASE_TIMEOUT,
      scoreRange: 20,
    });
    allPuzzles.push(...medium);
  }

  // Phase 4: Hard (score 60-85, 5-7 pieces) - use hill climbing
  console.log("📦 Phase 4: Hard (Levels 61-80) [with hill climbing]");
  if (!isTimedOut()) {
    const hard = generatePuzzlesForRange(20, 60, 85, 5, 7, {
      phaseTimeoutMs: PHASE_TIMEOUT * 1.2, // Extra time for hard
      scoreRange: 25,
      useHillClimbing: true,
    });
    allPuzzles.push(...hard);
  }

  // Phase 5: Very Hard (score 80-100, 6-8 pieces) - heavy hill climbing
  console.log("📦 Phase 5: Very Hard (Levels 81-100) [with hill climbing]");
  if (!isTimedOut()) {
    const veryHard = generatePuzzlesForRange(20, 80, 100, 6, 8, {
      phaseTimeoutMs: PHASE_TIMEOUT * 1.5, // More time for very hard
      scoreRange: 30,
      useHillClimbing: true,
    });
    allPuzzles.push(...veryHard);
  }

  // Sort all puzzles by difficulty score
  allPuzzles.sort((a, b) => a.score - b.score);

  // Format as levels
  const levels = allPuzzles.map((puzzle, index) => ({
    level: index + 1,
    fen: puzzle.fen,
    difficulty: getDifficultyLabel(puzzle.score),
    score: puzzle.score,
    pieceCount: puzzle.pieceCount,
  }));

  // Generate the JavaScript module
  const output = `/**
 * Pre-generated levels for Chesslet
 * Generated on ${new Date().toISOString()}
 * 
 * ${levels.length} levels of increasing difficulty
 * Generated with weighted piece selection and hill climbing
 */

export const LEVELS = ${JSON.stringify(levels, null, 2)};

export const TOTAL_LEVELS = ${levels.length};

/**
 * Get a level by its number (1-indexed)
 */
export function getLevel(levelNumber) {
  if (levelNumber < 1 || levelNumber > LEVELS.length) {
    return null;
  }
  return LEVELS[levelNumber - 1];
}

/**
 * Get difficulty label from score
 */
export function getDifficultyFromScore(score) {
  if (score < 20) return "very-easy";
  if (score < 35) return "easy";
  if (score < 50) return "medium";
  if (score < 70) return "hard";
  return "very-hard";
}
`;

  // Write to file
  const outputPath = join(__dirname, "../lib/levels.js");
  writeFileSync(outputPath, output);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n================================");
  console.log(`✅ Generated ${levels.length} levels in ${elapsed}s`);
  console.log(`📁 Saved to: lib/levels.js`);
  console.log("\nDifficulty distribution:");
  console.log(
    `  Very Easy: ${levels.filter((l) => l.difficulty === "very-easy").length}`
  );
  console.log(
    `  Easy: ${levels.filter((l) => l.difficulty === "easy").length}`
  );
  console.log(
    `  Medium: ${levels.filter((l) => l.difficulty === "medium").length}`
  );
  console.log(
    `  Hard: ${levels.filter((l) => l.difficulty === "hard").length}`
  );
  console.log(
    `  Very Hard: ${levels.filter((l) => l.difficulty === "very-hard").length}`
  );
  console.log("\nScore range:");
  console.log(`  Min: ${Math.min(...levels.map((l) => l.score))}`);
  console.log(`  Max: ${Math.max(...levels.map((l) => l.score))}`);

  // Show some sample hard puzzles
  const hardPuzzles = levels.filter((l) => l.score >= 80).slice(-5);
  if (hardPuzzles.length > 0) {
    console.log("\nHardest puzzles generated:");
    for (const p of hardPuzzles) {
      console.log(`  Level ${p.level}: ${p.fen} (score: ${p.score})`);
    }
  }
}

function getDifficultyLabel(score) {
  if (score < 20) return "very-easy";
  if (score < 35) return "easy";
  if (score < 50) return "medium";
  if (score < 70) return "hard";
  return "very-hard";
}

main().catch(console.error);
