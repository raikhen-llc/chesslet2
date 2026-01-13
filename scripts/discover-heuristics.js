#!/usr/bin/env node

/**
 * Heuristic Discovery Script for Chesslet
 * 
 * Generates many random puzzles, analyzes patterns in hard vs easy puzzles,
 * and outputs actionable insights for improving puzzle generation.
 * 
 * Usage: node scripts/discover-heuristics.js
 * 
 * Max runtime: 5 minutes
 */

import { createEmptyBoard, boardToFen, countPieces, fenToBoard } from "../lib/fen.js";
import { isSolvable, getPuzzleMetrics } from "../lib/solver.js";
import { getAllValidMoves } from "../lib/engine.js";

const BOARD_SIZE = 4;
const PIECES = ["K", "Q", "R", "B", "N", "P"];
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const startTime = Date.now();

/**
 * Check if timed out
 */
function isTimedOut() {
  return Date.now() - startTime >= TIMEOUT_MS;
}

/**
 * Generate random board with uniform piece selection
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
 * Analyze a board for various properties
 */
function analyzeBoard(board) {
  const piecePositions = [];
  const pieceCounts = { K: 0, Q: 0, R: 0, B: 0, N: 0, P: 0 };
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece) {
        piecePositions.push({ row, col, piece });
        pieceCounts[piece]++;
      }
    }
  }
  
  // Position analysis
  let cornerCount = 0;
  let edgeCount = 0;
  let centerCount = 0;
  
  for (const { row, col } of piecePositions) {
    const isCorner = (row === 0 || row === 3) && (col === 0 || col === 3);
    const isEdge = !isCorner && (row === 0 || row === 3 || col === 0 || col === 3);
    
    if (isCorner) cornerCount++;
    else if (isEdge) edgeCount++;
    else centerCount++;
  }
  
  // Mobility analysis
  const lowMobilityPieces = pieceCounts.P + pieceCounts.N + pieceCounts.K;
  const highMobilityPieces = pieceCounts.Q + pieceCounts.R + pieceCounts.B;
  const totalPieces = lowMobilityPieces + highMobilityPieces;
  
  // Initial move count
  const initialMoves = getAllValidMoves(board).length;
  
  return {
    pieceCounts,
    totalPieces,
    lowMobilityRatio: totalPieces > 0 ? lowMobilityPieces / totalPieces : 0,
    highMobilityRatio: totalPieces > 0 ? highMobilityPieces / totalPieces : 0,
    cornerCount,
    edgeCount,
    centerCount,
    cornerRatio: totalPieces > 0 ? cornerCount / totalPieces : 0,
    edgeRatio: totalPieces > 0 ? edgeCount / totalPieces : 0,
    centerRatio: totalPieces > 0 ? centerCount / totalPieces : 0,
    initialMoves,
    hasQueen: pieceCounts.Q > 0,
    queenCount: pieceCounts.Q,
    pawnCount: pieceCounts.P,
    knightCount: pieceCounts.N,
  };
}

/**
 * Generate puzzles and collect statistics
 */
function generatePuzzlesForAnalysis(targetCount = 1000) {
  const puzzles = [];
  let generated = 0;
  let attempts = 0;
  
  console.log(`Generating ${targetCount} puzzles for analysis...`);
  
  while (puzzles.length < targetCount && !isTimedOut()) {
    attempts++;
    
    // Vary piece count from 2 to 8
    const pieceCount = Math.floor(Math.random() * 7) + 2;
    const board = generateRandomBoard(pieceCount);
    
    if (!isSolvable(board)) continue;
    
    generated++;
    
    try {
      const metrics = getPuzzleMetrics(board);
      const analysis = analyzeBoard(board);
      
      puzzles.push({
        fen: boardToFen(board),
        score: metrics.weightedDifficulty,
        ...analysis,
        solutionCount: metrics.solutionCount,
        minPieceChanges: metrics.minPieceChangesForSolution,
        maxPieceChanges: metrics.maxPieceChangesForSolution,
        totalPaths: metrics.totalPaths,
      });
      
      if (puzzles.length % 100 === 0) {
        process.stdout.write(`\r  Generated ${puzzles.length}/${targetCount} (${attempts} attempts)`);
      }
    } catch (e) {
      // Skip puzzles that cause issues
    }
  }
  
  console.log(`\n  Done: ${puzzles.length} puzzles from ${attempts} attempts`);
  return puzzles;
}

/**
 * Calculate statistics for a group of puzzles
 */
function calculateStats(puzzles) {
  if (puzzles.length === 0) return null;
  
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  
  const pieceCounts = { K: 0, Q: 0, R: 0, B: 0, N: 0, P: 0 };
  for (const p of puzzles) {
    for (const piece of PIECES) {
      pieceCounts[piece] += p.pieceCounts[piece];
    }
  }
  const totalPiecesAll = sum(Object.values(pieceCounts));
  
  return {
    count: puzzles.length,
    avgScore: avg(puzzles.map(p => p.score)).toFixed(1),
    avgPieceCount: avg(puzzles.map(p => p.totalPieces)).toFixed(2),
    avgLowMobilityRatio: (avg(puzzles.map(p => p.lowMobilityRatio)) * 100).toFixed(1) + "%",
    avgHighMobilityRatio: (avg(puzzles.map(p => p.highMobilityRatio)) * 100).toFixed(1) + "%",
    avgCornerRatio: (avg(puzzles.map(p => p.cornerRatio)) * 100).toFixed(1) + "%",
    avgEdgeRatio: (avg(puzzles.map(p => p.edgeRatio)) * 100).toFixed(1) + "%",
    avgCenterRatio: (avg(puzzles.map(p => p.centerRatio)) * 100).toFixed(1) + "%",
    avgInitialMoves: avg(puzzles.map(p => p.initialMoves)).toFixed(2),
    avgSolutionCount: avg(puzzles.map(p => p.solutionCount)).toFixed(1),
    avgMinPieceChanges: avg(puzzles.map(p => p.minPieceChanges || 0)).toFixed(2),
    pctWithQueen: (puzzles.filter(p => p.hasQueen).length / puzzles.length * 100).toFixed(1) + "%",
    pieceDistribution: Object.fromEntries(
      PIECES.map(piece => [piece, ((pieceCounts[piece] / totalPiecesAll) * 100).toFixed(1) + "%"])
    ),
  };
}

/**
 * Compare two groups of puzzles
 */
function comparePuzzleGroups(hard, easy, hardLabel = "Hard", easyLabel = "Easy") {
  const hardStats = calculateStats(hard);
  const easyStats = calculateStats(easy);
  
  if (!hardStats || !easyStats) {
    console.log("Not enough data for comparison");
    return;
  }
  
  console.log(`\n${"=".repeat(70)}`);
  console.log(`COMPARISON: ${hardLabel} (n=${hardStats.count}) vs ${easyLabel} (n=${easyStats.count})`);
  console.log("=".repeat(70));
  
  const metrics = [
    ["Avg Score", hardStats.avgScore, easyStats.avgScore],
    ["Avg Pieces", hardStats.avgPieceCount, easyStats.avgPieceCount],
    ["Low Mobility %", hardStats.avgLowMobilityRatio, easyStats.avgLowMobilityRatio],
    ["High Mobility %", hardStats.avgHighMobilityRatio, easyStats.avgHighMobilityRatio],
    ["Corner %", hardStats.avgCornerRatio, easyStats.avgCornerRatio],
    ["Edge %", hardStats.avgEdgeRatio, easyStats.avgEdgeRatio],
    ["Center %", hardStats.avgCenterRatio, easyStats.avgCenterRatio],
    ["Avg Initial Moves", hardStats.avgInitialMoves, easyStats.avgInitialMoves],
    ["Avg Solutions", hardStats.avgSolutionCount, easyStats.avgSolutionCount],
    ["Avg Min Piece Changes", hardStats.avgMinPieceChanges, easyStats.avgMinPieceChanges],
    ["Has Queen %", hardStats.pctWithQueen, easyStats.pctWithQueen],
  ];
  
  console.log(`\n${"Metric".padEnd(25)}${hardLabel.padEnd(20)}${easyLabel.padEnd(20)}Insight`);
  console.log("-".repeat(70));
  
  for (const [metric, hardVal, easyVal] of metrics) {
    // Determine if there's a significant difference
    const hardNum = parseFloat(hardVal);
    const easyNum = parseFloat(easyVal);
    let insight = "";
    
    if (!isNaN(hardNum) && !isNaN(easyNum)) {
      const diff = hardNum - easyNum;
      const pctDiff = easyNum !== 0 ? Math.abs(diff / easyNum * 100) : 100;
      
      if (pctDiff > 20) {
        insight = diff > 0 ? "⬆️ Higher in hard" : "⬇️ Lower in hard";
      }
    }
    
    console.log(`${metric.padEnd(25)}${String(hardVal).padEnd(20)}${String(easyVal).padEnd(20)}${insight}`);
  }
  
  // Piece distribution comparison
  console.log(`\nPiece Distribution:`);
  console.log("-".repeat(70));
  console.log(`${"Piece".padEnd(10)}${hardLabel.padEnd(20)}${easyLabel.padEnd(20)}Insight`);
  
  for (const piece of PIECES) {
    const hardPct = hardStats.pieceDistribution[piece];
    const easyPct = easyStats.pieceDistribution[piece];
    const hardNum = parseFloat(hardPct);
    const easyNum = parseFloat(easyPct);
    const diff = hardNum - easyNum;
    let insight = "";
    
    if (Math.abs(diff) > 5) {
      insight = diff > 0 ? `⬆️ +${diff.toFixed(1)}%` : `⬇️ ${diff.toFixed(1)}%`;
    }
    
    console.log(`${piece.padEnd(10)}${hardPct.padEnd(20)}${easyPct.padEnd(20)}${insight}`);
  }
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(puzzles) {
  const veryHard = puzzles.filter(p => p.score >= 80);
  const hard = puzzles.filter(p => p.score >= 60 && p.score < 80);
  const medium = puzzles.filter(p => p.score >= 40 && p.score < 60);
  const easy = puzzles.filter(p => p.score >= 20 && p.score < 40);
  const veryEasy = puzzles.filter(p => p.score < 20);
  
  console.log("\n" + "=".repeat(70));
  console.log("DISTRIBUTION SUMMARY");
  console.log("=".repeat(70));
  console.log(`Very Easy (0-19):   ${veryEasy.length} (${(veryEasy.length/puzzles.length*100).toFixed(1)}%)`);
  console.log(`Easy (20-39):       ${easy.length} (${(easy.length/puzzles.length*100).toFixed(1)}%)`);
  console.log(`Medium (40-59):     ${medium.length} (${(medium.length/puzzles.length*100).toFixed(1)}%)`);
  console.log(`Hard (60-79):       ${hard.length} (${(hard.length/puzzles.length*100).toFixed(1)}%)`);
  console.log(`Very Hard (80-100): ${veryHard.length} (${(veryHard.length/puzzles.length*100).toFixed(1)}%)`);
  
  // Compare extreme ends
  comparePuzzleGroups(veryHard, veryEasy, "Very Hard (80+)", "Very Easy (<20)");
  
  // Generate recommendations
  console.log("\n" + "=".repeat(70));
  console.log("ACTIONABLE RECOMMENDATIONS");
  console.log("=".repeat(70));
  
  const hardStats = calculateStats(veryHard);
  const easyStats = calculateStats(veryEasy);
  
  if (hardStats && easyStats) {
    const recommendations = [];
    
    // Low mobility analysis
    const hardLowMob = parseFloat(hardStats.avgLowMobilityRatio);
    const easyLowMob = parseFloat(easyStats.avgLowMobilityRatio);
    if (hardLowMob > easyLowMob + 10) {
      recommendations.push(`✅ CONFIRMED: Low-mobility pieces (P/N/K) strongly correlate with difficulty.`);
      recommendations.push(`   Hard puzzles: ${hardStats.avgLowMobilityRatio} low-mobility vs Easy: ${easyStats.avgLowMobilityRatio}`);
    }
    
    // Queen analysis
    const hardQueenPct = parseFloat(hardStats.pctWithQueen);
    const easyQueenPct = parseFloat(easyStats.pctWithQueen);
    if (easyQueenPct > hardQueenPct + 10) {
      recommendations.push(`✅ CONFIRMED: Queens make puzzles easier. Reduce queen weight.`);
      recommendations.push(`   Hard puzzles with queen: ${hardStats.pctWithQueen} vs Easy: ${easyStats.pctWithQueen}`);
    }
    
    // Initial moves analysis
    const hardMoves = parseFloat(hardStats.avgInitialMoves);
    const easyMoves = parseFloat(easyStats.avgInitialMoves);
    if (easyMoves > hardMoves * 1.3) {
      recommendations.push(`✅ CONFIRMED: Fewer initial moves correlates with harder puzzles.`);
      recommendations.push(`   Hard: ${hardStats.avgInitialMoves} moves vs Easy: ${easyStats.avgInitialMoves} moves`);
    }
    
    // Piece changes
    const hardChanges = parseFloat(hardStats.avgMinPieceChanges);
    const easyChanges = parseFloat(easyStats.avgMinPieceChanges);
    if (hardChanges > easyChanges + 0.3) {
      recommendations.push(`✅ CONFIRMED: Hard puzzles require more piece changes.`);
      recommendations.push(`   Hard: ${hardStats.avgMinPieceChanges} changes vs Easy: ${easyStats.avgMinPieceChanges} changes`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push("⚠️ No strong patterns detected. Consider generating more samples.");
    }
    
    for (const rec of recommendations) {
      console.log(rec);
    }
  }
  
  // Show some example hard puzzles
  if (veryHard.length > 0) {
    console.log("\n" + "=".repeat(70));
    console.log("EXAMPLE VERY HARD PUZZLES");
    console.log("=".repeat(70));
    
    const examples = veryHard.slice(0, 10);
    for (const p of examples) {
      console.log(`  ${p.fen.padEnd(20)} score=${p.score.toString().padEnd(4)} pieces=${p.totalPieces} ` +
        `Q=${p.queenCount} P=${p.pawnCount} N=${p.knightCount} minChg=${p.minPieceChanges}`);
    }
  }
}

async function main() {
  console.log("🔬 Chesslet Heuristic Discovery");
  console.log("================================");
  console.log("Analyzing what makes puzzles hard...\n");
  
  const puzzles = generatePuzzlesForAnalysis(2000);
  
  if (puzzles.length < 100) {
    console.log("Not enough puzzles generated for meaningful analysis.");
    return;
  }
  
  generateRecommendations(puzzles);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️  Completed in ${elapsed}s`);
}

main().catch(console.error);
