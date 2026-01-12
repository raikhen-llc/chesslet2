#!/usr/bin/env node

/**
 * Generate 100 puzzles of increasing difficulty for Chesslet
 *
 * Usage: node scripts/generate-levels.js
 *
 * This script generates puzzles with progressively increasing difficulty
 * and saves them to lib/levels.js
 */

import { createEmptyBoard, boardToFen, countPieces } from "../lib/fen.js";
import { isSolvable, getPuzzleMetrics } from "../lib/solver.js";
import { getAllValidMoves } from "../lib/engine.js";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PIECES = ["K", "Q", "R", "B", "N", "P"];
const BOARD_SIZE = 4;
const TARGET_LEVELS = 100;

/**
 * Generate a random board with the specified number of pieces
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

  // Place pieces
  for (let i = 0; i < Math.min(pieceCount, positions.length); i++) {
    const { row, col } = positions[i];
    const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
    board[row][col] = piece;
  }

  return board;
}

/**
 * Generate a puzzle with specific constraints
 */
function generatePuzzle(options = {}) {
  const {
    minPieces = 2,
    maxPieces = 8,
    targetScore = null,
    scoreRange = 10,
    maxAttempts = 500,
    preferHigher = false, // For hard puzzles, prefer higher scores
  } = options;

  let bestPuzzle = null;
  let bestScoreDiff = Infinity;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
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

    // For hard puzzles, if we're above target and within range, that's better
    const effectiveDiff =
      preferHigher && score >= targetScore
        ? Math.max(0, scoreDiff - 10) // Bonus for being above target
        : scoreDiff;

    if (scoreDiff <= scoreRange && effectiveDiff < bestScoreDiff) {
      bestScoreDiff = effectiveDiff;
      bestPuzzle = puzzle;
    }

    if (bestScoreDiff <= 2) break;
  }

  return bestPuzzle;
}

/**
 * Generate puzzles for a specific difficulty range
 */
function generatePuzzlesForRange(
  count,
  minScore,
  maxScore,
  minPieces,
  maxPieces,
  options = {}
) {
  const { maxAttempts = 2000, scoreRange = 15, preferHigher = false } = options;

  const puzzles = [];
  const usedFens = new Set();

  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const targetScore = minScore + (maxScore - minScore) * progress;

    let puzzle = null;
    let attempts = 0;

    while (!puzzle && attempts < 30) {
      puzzle = generatePuzzle({
        minPieces,
        maxPieces,
        targetScore,
        scoreRange,
        maxAttempts,
        preferHigher,
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
        `\rGenerated ${
          puzzles.length
        }/${count} puzzles for range ${minScore}-${maxScore} (target: ${Math.round(
          targetScore
        )}, got: ${puzzle.score})...`
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
  console.log("🎮 Chesslet Level Generator");
  console.log("============================");
  console.log(
    `Generating ${TARGET_LEVELS} puzzles with increasing difficulty...\n`
  );
  console.log(
    "Using exponential decay weighting (linear solutions heavily penalized)\n"
  );

  const allPuzzles = [];

  // Level distribution with new exponential decay weighting:
  // With β=0.2, puzzles with linear solutions will score very low
  // Hard puzzles MUST require piece changes
  //
  // Levels 1-20: Very Easy (score 0-30, 2-4 pieces) - linear solutions OK
  // Levels 21-40: Easy (score 20-50, 3-5 pieces)
  // Levels 41-60: Medium (score 40-65, 4-6 pieces)
  // Levels 61-80: Hard (score 55-80, 5-7 pieces) - hunt for non-linear
  // Levels 81-100: Very Hard (score 70-100, 6-8 pieces) - exhaustive hunt

  console.log("Phase 1: Very Easy (Levels 1-20)");
  const veryEasy = generatePuzzlesForRange(20, 0, 30, 2, 4, {
    maxAttempts: 1000,
  });
  allPuzzles.push(...veryEasy);

  console.log("Phase 2: Easy (Levels 21-40)");
  const easy = generatePuzzlesForRange(20, 20, 50, 3, 5, { maxAttempts: 2000 });
  allPuzzles.push(...easy);

  console.log("Phase 3: Medium (Levels 41-60)");
  const medium = generatePuzzlesForRange(20, 40, 65, 4, 6, {
    maxAttempts: 3000,
    preferHigher: true,
  });
  allPuzzles.push(...medium);

  console.log("Phase 4: Hard (Levels 61-80)");
  const hard = generatePuzzlesForRange(20, 55, 80, 5, 7, {
    maxAttempts: 5000,
    scoreRange: 20,
    preferHigher: true,
  });
  allPuzzles.push(...hard);

  console.log("Phase 5: Very Hard (Levels 81-100)");
  const veryHard = generatePuzzlesForRange(20, 70, 100, 6, 8, {
    maxAttempts: 5000,
    scoreRange: 25,
    preferHigher: true,
  });
  allPuzzles.push(...veryHard);

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
 * 100 levels of increasing difficulty
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

  console.log("\n============================");
  console.log(`✅ Generated ${levels.length} levels!`);
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
}

function getDifficultyLabel(score) {
  if (score < 20) return "very-easy";
  if (score < 35) return "easy";
  if (score < 50) return "medium";
  if (score < 70) return "hard";
  return "very-hard";
}

main().catch(console.error);
