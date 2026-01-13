#!/usr/bin/env node

/**
 * Difficulty Evaluation Script for Chesslet
 * 
 * Tests the scoring system against known hard and easy puzzles
 * to verify that difficulty scores match expected human difficulty.
 * 
 * Usage: node scripts/eval-difficulty.js
 */

import { fenToBoard } from "../lib/fen.js";
import { getPuzzleMetrics, isSolvable } from "../lib/solver.js";
import { LEVELS } from "../lib/levels.js";

// Test cases with expected difficulty
const TEST_CASES = [
  // Known hardest puzzle from user
  { fen: "N2N/1PP1/1PP1/N2N", expected: "very-hard", label: "User's hardest (4 knights + 4 pawns)" },
  
  // From existing levels - sample across difficulties
  { fen: "Q3/4/P3/4", expected: "very-easy", label: "Level 1 (2 pieces)" },
  { fen: "1N2/4/2R1/3K", expected: "very-easy", label: "Level 2 (3 pieces)" },
  { fen: "4/2QR/4/2BN", expected: "very-easy", label: "Level 3 (4 pieces)" },
  { fen: "4/4/Q1K1/3Q", expected: "easy", label: "Level 14" },
  { fen: "1K2/R2Q/4/4", expected: "medium", label: "Level 36" },
  { fen: "2R1/1Q2/3Q/N3", expected: "hard", label: "Level 44" },
  { fen: "3B/2KK/1K1N/3R", expected: "very-hard", label: "Level 65" },
  { fen: "B1B1/3P/1BR1/N2P", expected: "very-hard", label: "Level 100" },
  
  // Additional test cases - variations to explore
  { fen: "PPPP/PPPP/4/4", expected: "unknown", label: "8 pawns (test)" },
  { fen: "NNNN/4/4/NNNN", expected: "unknown", label: "8 knights (test)" },
  { fen: "K3/4/4/3K", expected: "unknown", label: "2 kings diagonal" },
  { fen: "QQQQ/4/4/4", expected: "unknown", label: "4 queens row" },
];

function getDifficultyLabel(score) {
  if (score < 20) return "very-easy";
  if (score < 35) return "easy";
  if (score < 50) return "medium";
  if (score < 70) return "hard";
  return "very-hard";
}

function formatMetrics(metrics) {
  return {
    score: metrics.weightedDifficulty,
    difficulty: getDifficultyLabel(metrics.weightedDifficulty),
    pieceCount: metrics.pieceCount,
    solutionCount: metrics.solutionCount,
    minMoves: metrics.minMoves,
    minPieceChanges: metrics.minPieceChangesForSolution,
    maxPieceChanges: metrics.maxPieceChangesForSolution,
    totalPaths: metrics.totalPaths,
    rawSolutionRatio: (metrics.rawSolutionRatio * 100).toFixed(1) + "%",
    weightedSolutionRatio: (metrics.weightedSolutionRatio * 100).toFixed(1) + "%",
  };
}

function evaluatePuzzle(fen, label, expected) {
  try {
    const board = fenToBoard(fen);
    
    if (!isSolvable(board)) {
      return {
        fen,
        label,
        expected,
        solvable: false,
        error: "Not solvable"
      };
    }
    
    const metrics = getPuzzleMetrics(board);
    const formatted = formatMetrics(metrics);
    
    return {
      fen,
      label,
      expected,
      solvable: true,
      ...formatted,
      matchesExpected: expected === "unknown" ? "N/A" : (formatted.difficulty === expected ? "✓" : "✗"),
    };
  } catch (error) {
    return {
      fen,
      label,
      expected,
      solvable: false,
      error: error.message
    };
  }
}

function printTable(results) {
  console.log("\n" + "=".repeat(120));
  console.log("DIFFICULTY EVALUATION RESULTS");
  console.log("=".repeat(120));
  
  // Header
  console.log(
    padRight("Label", 40) +
    padRight("FEN", 20) +
    padRight("Score", 8) +
    padRight("Computed", 12) +
    padRight("Expected", 12) +
    padRight("Match", 6) +
    padRight("MinChg", 8) +
    padRight("Solns", 8)
  );
  console.log("-".repeat(120));
  
  for (const result of results) {
    if (!result.solvable) {
      console.log(
        padRight(result.label, 40) +
        padRight(result.fen, 20) +
        padRight("N/A", 8) +
        padRight(result.error || "Unsolvable", 12) +
        padRight(result.expected, 12) +
        padRight("-", 6) +
        padRight("-", 8) +
        padRight("-", 8)
      );
    } else {
      console.log(
        padRight(result.label, 40) +
        padRight(result.fen, 20) +
        padRight(String(result.score), 8) +
        padRight(result.difficulty, 12) +
        padRight(result.expected, 12) +
        padRight(result.matchesExpected, 6) +
        padRight(result.minPieceChanges !== null ? String(result.minPieceChanges) : "-", 8) +
        padRight(String(result.solutionCount), 8)
      );
    }
  }
  
  console.log("=".repeat(120));
}

function padRight(str, len) {
  return String(str).substring(0, len).padEnd(len);
}

function printDetailedAnalysis(results) {
  console.log("\n" + "=".repeat(80));
  console.log("DETAILED ANALYSIS");
  console.log("=".repeat(80));
  
  const solvable = results.filter(r => r.solvable);
  
  // Sort by score
  const sorted = [...solvable].sort((a, b) => b.score - a.score);
  
  console.log("\nPuzzles ranked by difficulty score (highest first):");
  console.log("-".repeat(80));
  
  for (const result of sorted) {
    console.log(`\n${result.label}`);
    console.log(`  FEN: ${result.fen}`);
    console.log(`  Score: ${result.score} (${result.difficulty})`);
    console.log(`  Pieces: ${result.pieceCount}`);
    console.log(`  Solutions: ${result.solutionCount}`);
    console.log(`  Min piece changes for solution: ${result.minPieceChanges}`);
    console.log(`  Max piece changes for solution: ${result.maxPieceChanges}`);
    console.log(`  Total paths explored: ${result.totalPaths}`);
    console.log(`  Raw solution ratio: ${result.rawSolutionRatio}`);
    console.log(`  Weighted solution ratio: ${result.weightedSolutionRatio}`);
  }
  
  // Summary statistics
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  
  const userHardest = solvable.find(r => r.label.includes("User's hardest"));
  const level1 = solvable.find(r => r.label.includes("Level 1"));
  
  if (userHardest && level1) {
    console.log(`\nUser's hardest puzzle score: ${userHardest.score}`);
    console.log(`Level 1 (easiest) score: ${level1.score}`);
    console.log(`Difference: ${userHardest.score - level1.score} points`);
    console.log(`\nScoring system ${userHardest.score > level1.score + 50 ? "VALIDATES" : "NEEDS TUNING"}: ` +
      `Hard puzzle should score significantly higher than easy puzzle.`);
  }
  
  // Check correlation with expected
  const withExpected = solvable.filter(r => r.expected !== "unknown");
  const matches = withExpected.filter(r => r.matchesExpected === "✓").length;
  console.log(`\nExpected difficulty match rate: ${matches}/${withExpected.length} (${(matches/withExpected.length*100).toFixed(0)}%)`);
}

async function main() {
  console.log("🎯 Chesslet Difficulty Evaluation");
  console.log("Testing scoring system against known puzzles...\n");
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    process.stdout.write(`Evaluating: ${testCase.label}... `);
    const result = evaluatePuzzle(testCase.fen, testCase.label, testCase.expected);
    results.push(result);
    console.log(result.solvable ? `Score: ${result.score}` : `Error: ${result.error}`);
  }
  
  printTable(results);
  printDetailedAnalysis(results);
}

main().catch(console.error);
