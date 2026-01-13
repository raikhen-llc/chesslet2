/**
 * Tests for lib/levels.js - Pre-generated levels
 */

import {
  LEVELS,
  TOTAL_LEVELS,
  getLevel,
  getDifficultyFromScore,
} from '../../lib/levels';
import { fenToBoard } from '../../lib/fen';
import { isSolvable } from '../../lib/solver';

describe('Levels - LEVELS array', () => {
  test('Has expected number of levels', () => {
    expect(LEVELS).toHaveLength(TOTAL_LEVELS);
    expect(LEVELS).toHaveLength(100);
  });

  test('Each level has required properties', () => {
    for (const level of LEVELS) {
      expect(level.level).toBeDefined();
      expect(level.fen).toBeDefined();
      expect(level.difficulty).toBeDefined();
      expect(level.score).toBeDefined();
      expect(level.pieceCount).toBeDefined();
    }
  });

  test('Levels are numbered 1 to 100', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      expect(LEVELS[i].level).toBe(i + 1);
    }
  });

  test('All level FENs are valid', () => {
    for (const level of LEVELS) {
      expect(() => fenToBoard(level.fen)).not.toThrow();
    }
  });

  test('All levels are solvable', () => {
    // This is the most important test - verify every pre-generated level can be solved
    for (const level of LEVELS) {
      const board = fenToBoard(level.fen);
      const solvable = isSolvable(board);
      
      expect(solvable).toBe(true);
    }
  }, 30000); // Allow extra time for this test

  test('Scores generally increase with level number', () => {
    // Verify general progression - scores should trend upward
    const firstQuarter = LEVELS.slice(0, 25);
    const lastQuarter = LEVELS.slice(75);

    const avgFirst = firstQuarter.reduce((sum, l) => sum + l.score, 0) / firstQuarter.length;
    const avgLast = lastQuarter.reduce((sum, l) => sum + l.score, 0) / lastQuarter.length;

    expect(avgLast).toBeGreaterThan(avgFirst);
  });

  test('Piece counts are within valid range', () => {
    for (const level of LEVELS) {
      expect(level.pieceCount).toBeGreaterThanOrEqual(2);
      expect(level.pieceCount).toBeLessThanOrEqual(16); // Max for 4x4 board
    }
  });

  test('Difficulty labels are valid', () => {
    const validDifficulties = ['very-easy', 'easy', 'medium', 'hard', 'very-hard'];
    
    for (const level of LEVELS) {
      expect(validDifficulties).toContain(level.difficulty);
    }
  });
});

describe('Levels - getLevel', () => {
  test('Returns correct level for valid numbers', () => {
    const level1 = getLevel(1);
    expect(level1).not.toBeNull();
    expect(level1.level).toBe(1);

    const level50 = getLevel(50);
    expect(level50).not.toBeNull();
    expect(level50.level).toBe(50);

    const level100 = getLevel(100);
    expect(level100).not.toBeNull();
    expect(level100.level).toBe(100);
  });

  test('Returns null for level 0', () => {
    const level = getLevel(0);
    expect(level).toBeNull();
  });

  test('Returns null for negative level', () => {
    const level = getLevel(-1);
    expect(level).toBeNull();
  });

  test('Returns null for level above max', () => {
    const level = getLevel(101);
    expect(level).toBeNull();
  });

  test('Returns null for non-integer values beyond range', () => {
    const level = getLevel(1000);
    expect(level).toBeNull();
  });
});

describe('Levels - getDifficultyFromScore', () => {
  test('Returns very-easy for low scores', () => {
    expect(getDifficultyFromScore(0)).toBe('very-easy');
    expect(getDifficultyFromScore(10)).toBe('very-easy');
    expect(getDifficultyFromScore(19)).toBe('very-easy');
  });

  test('Returns easy for scores 20-34', () => {
    expect(getDifficultyFromScore(20)).toBe('easy');
    expect(getDifficultyFromScore(25)).toBe('easy');
    expect(getDifficultyFromScore(34)).toBe('easy');
  });

  test('Returns medium for scores 35-49', () => {
    expect(getDifficultyFromScore(35)).toBe('medium');
    expect(getDifficultyFromScore(40)).toBe('medium');
    expect(getDifficultyFromScore(49)).toBe('medium');
  });

  test('Returns hard for scores 50-69', () => {
    expect(getDifficultyFromScore(50)).toBe('hard');
    expect(getDifficultyFromScore(60)).toBe('hard');
    expect(getDifficultyFromScore(69)).toBe('hard');
  });

  test('Returns very-hard for scores 70+', () => {
    expect(getDifficultyFromScore(70)).toBe('very-hard');
    expect(getDifficultyFromScore(85)).toBe('very-hard');
    expect(getDifficultyFromScore(100)).toBe('very-hard');
  });
});

describe('Levels - Specific Level Verification', () => {
  test('Level 1 is easy', () => {
    const level = getLevel(1);
    expect(['very-easy', 'easy']).toContain(level.difficulty);
    expect(level.pieceCount).toBeLessThanOrEqual(4);
  });

  test('Level 50 is mid-difficulty', () => {
    const level = getLevel(50);
    expect(level.score).toBeGreaterThanOrEqual(20);
    expect(level.score).toBeLessThanOrEqual(80);
  });

  test('Level 100 is hard', () => {
    const level = getLevel(100);
    expect(['hard', 'very-hard']).toContain(level.difficulty);
    expect(level.score).toBeGreaterThanOrEqual(50);
  });

  test('First level FEN matches expected', () => {
    const level = getLevel(1);
    expect(level.fen).toBe('4/4/4/KN2');
  });

  test('Last level FEN matches expected', () => {
    const level = getLevel(100);
    expect(level.fen).toBe('1B2/NP2/2N1/NN2');
  });
});

describe('Levels - Level Diversity', () => {
  test('Levels have variety of piece counts', () => {
    const pieceCounts = new Set(LEVELS.map(l => l.pieceCount));
    // Should have multiple different piece counts
    expect(pieceCounts.size).toBeGreaterThan(3);
  });

  test('Levels have variety of difficulties', () => {
    const difficulties = new Set(LEVELS.map(l => l.difficulty));
    // Should have multiple difficulty levels
    expect(difficulties.size).toBeGreaterThanOrEqual(3);
  });

  test('No duplicate FENs', () => {
    const fens = LEVELS.map(l => l.fen);
    const uniqueFens = new Set(fens);
    expect(uniqueFens.size).toBe(fens.length);
  });
});

describe('Levels - Score-Difficulty Consistency', () => {
  test('Level difficulty matches score ranges', () => {
    for (const level of LEVELS) {
      const expectedDifficulty = getDifficultyFromScore(level.score);
      expect(level.difficulty).toBe(expectedDifficulty);
    }
  });
});
