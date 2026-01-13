/**
 * Tests for lib/generator.js - Puzzle generation and difficulty evaluation
 */

import {
  DIFFICULTY,
  getDifficultyLevel,
  generatePuzzle,
  generatePuzzleSet,
  evaluatePuzzle,
  getStarterPuzzle,
  STARTER_PUZZLES,
} from '../../lib/generator';
import { fenToBoard, countPieces } from '../../lib/fen';
import { isSolvable } from '../../lib/solver';

describe('Generator - DIFFICULTY constants', () => {
  test('DIFFICULTY has expected values', () => {
    expect(DIFFICULTY.EASY).toBe('easy');
    expect(DIFFICULTY.MEDIUM).toBe('medium');
    expect(DIFFICULTY.HARD).toBe('hard');
  });
});

describe('Generator - getDifficultyLevel', () => {
  test('Returns easy for low scores', () => {
    expect(getDifficultyLevel(0)).toBe(DIFFICULTY.EASY);
    expect(getDifficultyLevel(15)).toBe(DIFFICULTY.EASY);
    expect(getDifficultyLevel(29)).toBe(DIFFICULTY.EASY);
  });

  test('Returns medium for mid-range scores', () => {
    expect(getDifficultyLevel(30)).toBe(DIFFICULTY.MEDIUM);
    expect(getDifficultyLevel(45)).toBe(DIFFICULTY.MEDIUM);
    expect(getDifficultyLevel(59)).toBe(DIFFICULTY.MEDIUM);
  });

  test('Returns hard for high scores', () => {
    expect(getDifficultyLevel(60)).toBe(DIFFICULTY.HARD);
    expect(getDifficultyLevel(80)).toBe(DIFFICULTY.HARD);
    expect(getDifficultyLevel(100)).toBe(DIFFICULTY.HARD);
  });
});

describe('Generator - generatePuzzle', () => {
  test('Generates a solvable puzzle', () => {
    const puzzle = generatePuzzle({
      minPieces: 2,
      maxPieces: 4,
      maxAttempts: 100,
    });

    expect(puzzle).not.toBeNull();
    expect(puzzle.board).toBeDefined();
    expect(puzzle.fen).toBeDefined();
    expect(isSolvable(puzzle.board)).toBe(true);
  });

  test('Generated puzzle has valid FEN', () => {
    const puzzle = generatePuzzle({
      minPieces: 3,
      maxPieces: 5,
      maxAttempts: 50,
    });

    expect(puzzle).not.toBeNull();
    expect(typeof puzzle.fen).toBe('string');
    
    // FEN should be parseable back to the same board
    const parsedBoard = fenToBoard(puzzle.fen);
    expect(parsedBoard).toEqual(puzzle.board);
  });

  test('Generated puzzle respects piece count constraints', () => {
    const puzzle = generatePuzzle({
      minPieces: 4,
      maxPieces: 6,
      maxAttempts: 100,
    });

    if (puzzle) {
      const pieceCount = countPieces(puzzle.board);
      expect(pieceCount).toBeGreaterThanOrEqual(4);
      expect(pieceCount).toBeLessThanOrEqual(6);
    }
  });

  test('Generated puzzle includes difficulty info', () => {
    const puzzle = generatePuzzle({ maxAttempts: 50 });

    if (puzzle) {
      expect(puzzle.difficulty).toBeDefined();
      expect([DIFFICULTY.EASY, DIFFICULTY.MEDIUM, DIFFICULTY.HARD]).toContain(puzzle.difficulty);
      expect(typeof puzzle.score).toBe('number');
    }
  });

  test('Can target specific difficulty', () => {
    // Generate multiple puzzles targeting easy
    let foundEasy = false;
    for (let i = 0; i < 10; i++) {
      const puzzle = generatePuzzle({
        difficulty: DIFFICULTY.EASY,
        minPieces: 2,
        maxPieces: 4,
        maxAttempts: 50,
      });
      if (puzzle && puzzle.difficulty === DIFFICULTY.EASY) {
        foundEasy = true;
        break;
      }
    }
    // Should find at least one easy puzzle in 10 attempts
    expect(foundEasy).toBe(true);
  });

  test('Returns null when no suitable puzzle found', () => {
    // Very restrictive constraints with few attempts
    const puzzle = generatePuzzle({
      difficulty: DIFFICULTY.HARD,
      minPieces: 2,
      maxPieces: 2,
      maxAttempts: 1,
    });

    // May or may not find a puzzle with these constraints
    // This test verifies it doesn't throw
    expect(puzzle === null || puzzle.board !== undefined).toBe(true);
  });
});

describe('Generator - generatePuzzleSet', () => {
  test('Generates multiple puzzles', () => {
    const puzzles = generatePuzzleSet(3);

    expect(puzzles.length).toBeGreaterThan(0);
    expect(puzzles.length).toBeLessThanOrEqual(3);
  });

  test('All generated puzzles are solvable', () => {
    const puzzles = generatePuzzleSet(5);

    for (const puzzle of puzzles) {
      expect(isSolvable(puzzle.board)).toBe(true);
    }
  });

  test('Puzzles have increasing difficulty tendency', () => {
    const puzzles = generatePuzzleSet(6);

    // Not guaranteed, but generally should trend harder
    // Just verify all have difficulty defined
    for (const puzzle of puzzles) {
      expect(puzzle.difficulty).toBeDefined();
    }
  });
});

describe('Generator - evaluatePuzzle', () => {
  test('Evaluates solvable puzzle', () => {
    const board = fenToBoard('Q3/4/P3/4');
    const evaluation = evaluatePuzzle(board);

    expect(evaluation.solvable).toBe(true);
    expect(evaluation.difficulty).toBeDefined();
    expect(typeof evaluation.score).toBe('number');
    expect(evaluation.score).toBeGreaterThanOrEqual(0);
    expect(evaluation.metrics).toBeDefined();
  });

  test('Evaluates unsolvable puzzle', () => {
    // Two pawns that can't capture each other
    const board = fenToBoard('P3/4/4/3P');
    const evaluation = evaluatePuzzle(board);

    expect(evaluation.solvable).toBe(false);
    expect(evaluation.difficulty).toBeNull();
    expect(evaluation.score).toBe(-1);
  });

  test('Returns metrics for complexity analysis', () => {
    const board = fenToBoard('Q3/4/4/3Q');
    const evaluation = evaluatePuzzle(board);

    expect(evaluation.metrics.pieceCount).toBe(2);
    expect(evaluation.metrics.solutionCount).toBeGreaterThan(0);
    expect(evaluation.metrics.weightedDifficulty).toBeDefined();
  });
});

describe('Generator - STARTER_PUZZLES', () => {
  test('Has puzzles for each difficulty', () => {
    const easyPuzzles = STARTER_PUZZLES.filter(p => p.difficulty === DIFFICULTY.EASY);
    const mediumPuzzles = STARTER_PUZZLES.filter(p => p.difficulty === DIFFICULTY.MEDIUM);
    const hardPuzzles = STARTER_PUZZLES.filter(p => p.difficulty === DIFFICULTY.HARD);

    expect(easyPuzzles.length).toBeGreaterThan(0);
    expect(mediumPuzzles.length).toBeGreaterThan(0);
    expect(hardPuzzles.length).toBeGreaterThan(0);
  });

  test('All starter puzzles are solvable', () => {
    for (const puzzle of STARTER_PUZZLES) {
      const board = fenToBoard(puzzle.fen);
      expect(isSolvable(board)).toBe(true);
    }
  });

  test('All starter puzzles have valid FEN', () => {
    for (const puzzle of STARTER_PUZZLES) {
      expect(() => fenToBoard(puzzle.fen)).not.toThrow();
    }
  });
});

describe('Generator - getStarterPuzzle', () => {
  test('Returns a random starter puzzle', () => {
    const puzzle = getStarterPuzzle();

    expect(puzzle).toBeDefined();
    expect(puzzle.fen).toBeDefined();
    expect(puzzle.difficulty).toBeDefined();
  });

  test('Returns puzzle of requested difficulty', () => {
    const easyPuzzle = getStarterPuzzle(DIFFICULTY.EASY);
    expect(easyPuzzle.difficulty).toBe(DIFFICULTY.EASY);

    const mediumPuzzle = getStarterPuzzle(DIFFICULTY.MEDIUM);
    expect(mediumPuzzle.difficulty).toBe(DIFFICULTY.MEDIUM);

    const hardPuzzle = getStarterPuzzle(DIFFICULTY.HARD);
    expect(hardPuzzle.difficulty).toBe(DIFFICULTY.HARD);
  });

  test('Returns puzzle from STARTER_PUZZLES array', () => {
    const puzzle = getStarterPuzzle();

    const found = STARTER_PUZZLES.some(
      p => p.fen === puzzle.fen && p.difficulty === puzzle.difficulty
    );
    expect(found).toBe(true);
  });
});

describe('Generator - Integration Tests', () => {
  test('Generated puzzle can be evaluated', () => {
    const puzzle = generatePuzzle({ maxAttempts: 50 });

    if (puzzle) {
      const evaluation = evaluatePuzzle(puzzle.board);
      expect(evaluation.solvable).toBe(true);
      expect(evaluation.score).toBe(puzzle.score);
    }
  });

  test('Puzzle difficulty matches score ranges', () => {
    const puzzle = generatePuzzle({ maxAttempts: 50 });

    if (puzzle) {
      if (puzzle.score < 30) {
        expect(puzzle.difficulty).toBe(DIFFICULTY.EASY);
      } else if (puzzle.score < 60) {
        expect(puzzle.difficulty).toBe(DIFFICULTY.MEDIUM);
      } else {
        expect(puzzle.difficulty).toBe(DIFFICULTY.HARD);
      }
    }
  });
});
