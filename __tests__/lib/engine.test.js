/**
 * Tests for lib/engine.js - Chess move validation engine
 */

import {
  getValidCaptures,
  isValidCapture,
  executeCapture,
  getAllValidMoves,
  isSolved,
  isStuck,
} from '../../lib/engine';
import { createEmptyBoard } from '../../lib/constants';

// Helper to create a board with specific pieces
function createBoard(pieces) {
  const board = createEmptyBoard();
  for (const { row, col, piece } of pieces) {
    board[row][col] = piece;
  }
  return board;
}

describe('Engine - King Captures', () => {
  test('King can capture adjacent pieces in all 8 directions', () => {
    // King at center (1,1) surrounded by pieces
    const board = createBoard([
      { row: 1, col: 1, piece: 'K' },
      { row: 0, col: 0, piece: 'P' }, // top-left
      { row: 0, col: 1, piece: 'P' }, // top
      { row: 0, col: 2, piece: 'P' }, // top-right
      { row: 1, col: 0, piece: 'P' }, // left
      { row: 1, col: 2, piece: 'P' }, // right
      { row: 2, col: 0, piece: 'P' }, // bottom-left
      { row: 2, col: 1, piece: 'P' }, // bottom
      { row: 2, col: 2, piece: 'P' }, // bottom-right
    ]);

    const captures = getValidCaptures(board, 1, 1);
    expect(captures).toHaveLength(8);
  });

  test('King in corner can only capture adjacent squares in bounds', () => {
    // King at corner (0,0)
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
      { row: 0, col: 1, piece: 'P' },
      { row: 1, col: 0, piece: 'P' },
      { row: 1, col: 1, piece: 'P' },
    ]);

    const captures = getValidCaptures(board, 0, 0);
    expect(captures).toHaveLength(3);
    expect(captures).toContainEqual({ row: 0, col: 1 });
    expect(captures).toContainEqual({ row: 1, col: 0 });
    expect(captures).toContainEqual({ row: 1, col: 1 });
  });

  test('King cannot capture empty squares', () => {
    const board = createBoard([
      { row: 1, col: 1, piece: 'K' },
    ]);

    const captures = getValidCaptures(board, 1, 1);
    expect(captures).toHaveLength(0);
  });
});

describe('Engine - Queen Captures', () => {
  test('Queen can capture in all 8 directions', () => {
    // Queen at (1,1) with pieces in all directions
    const board = createBoard([
      { row: 1, col: 1, piece: 'Q' },
      { row: 0, col: 1, piece: 'P' }, // up
      { row: 3, col: 1, piece: 'P' }, // down
      { row: 1, col: 0, piece: 'P' }, // left
      { row: 1, col: 3, piece: 'P' }, // right
      { row: 0, col: 0, piece: 'P' }, // diagonal up-left
      { row: 0, col: 2, piece: 'P' }, // diagonal up-right
      { row: 3, col: 3, piece: 'P' }, // diagonal down-right
    ]);

    const captures = getValidCaptures(board, 1, 1);
    expect(captures).toHaveLength(7);
  });

  test('Queen is blocked by intervening pieces', () => {
    // Queen at (0,0), piece at (0,2), another at (0,3)
    const board = createBoard([
      { row: 0, col: 0, piece: 'Q' },
      { row: 0, col: 2, piece: 'P' },
      { row: 0, col: 3, piece: 'P' }, // blocked by piece at (0,2)
    ]);

    const captures = getValidCaptures(board, 0, 0);
    expect(captures).toContainEqual({ row: 0, col: 2 });
    expect(captures).not.toContainEqual({ row: 0, col: 3 });
  });
});

describe('Engine - Rook Captures', () => {
  test('Rook can capture horizontally and vertically', () => {
    const board = createBoard([
      { row: 1, col: 1, piece: 'R' },
      { row: 0, col: 1, piece: 'P' }, // up
      { row: 3, col: 1, piece: 'P' }, // down
      { row: 1, col: 0, piece: 'P' }, // left
      { row: 1, col: 3, piece: 'P' }, // right
    ]);

    const captures = getValidCaptures(board, 1, 1);
    expect(captures).toHaveLength(4);
  });

  test('Rook cannot capture diagonally', () => {
    const board = createBoard([
      { row: 1, col: 1, piece: 'R' },
      { row: 0, col: 0, piece: 'P' }, // diagonal - should not be capturable
      { row: 2, col: 2, piece: 'P' }, // diagonal - should not be capturable
    ]);

    const captures = getValidCaptures(board, 1, 1);
    expect(captures).toHaveLength(0);
  });

  test('Rook is blocked by intervening pieces', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'R' },
      { row: 0, col: 1, piece: 'P' },
      { row: 0, col: 3, piece: 'P' }, // blocked
    ]);

    const captures = getValidCaptures(board, 0, 0);
    expect(captures).toContainEqual({ row: 0, col: 1 });
    expect(captures).not.toContainEqual({ row: 0, col: 3 });
  });
});

describe('Engine - Bishop Captures', () => {
  test('Bishop can capture diagonally', () => {
    const board = createBoard([
      { row: 1, col: 1, piece: 'B' },
      { row: 0, col: 0, piece: 'P' }, // up-left
      { row: 0, col: 2, piece: 'P' }, // up-right
      { row: 2, col: 0, piece: 'P' }, // down-left
      { row: 3, col: 3, piece: 'P' }, // down-right (far)
    ]);

    const captures = getValidCaptures(board, 1, 1);
    expect(captures).toHaveLength(4);
  });

  test('Bishop cannot capture horizontally or vertically', () => {
    const board = createBoard([
      { row: 1, col: 1, piece: 'B' },
      { row: 0, col: 1, piece: 'P' }, // vertical - should not be capturable
      { row: 1, col: 0, piece: 'P' }, // horizontal - should not be capturable
    ]);

    const captures = getValidCaptures(board, 1, 1);
    expect(captures).toHaveLength(0);
  });

  test('Bishop is blocked by intervening pieces', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'B' },
      { row: 1, col: 1, piece: 'P' },
      { row: 3, col: 3, piece: 'P' }, // blocked by piece at (1,1)
    ]);

    const captures = getValidCaptures(board, 0, 0);
    expect(captures).toContainEqual({ row: 1, col: 1 });
    expect(captures).not.toContainEqual({ row: 3, col: 3 });
  });
});

describe('Engine - Knight Captures', () => {
  test('Knight can capture in L-shape pattern', () => {
    // Knight at (2,2) - central enough for some L moves
    const board = createBoard([
      { row: 2, col: 2, piece: 'N' },
      { row: 0, col: 1, piece: 'P' }, // 2 up, 1 left
      { row: 0, col: 3, piece: 'P' }, // 2 up, 1 right
      { row: 1, col: 0, piece: 'P' }, // 1 up, 2 left
      { row: 3, col: 0, piece: 'P' }, // 1 down, 2 left
    ]);

    const captures = getValidCaptures(board, 2, 2);
    expect(captures).toHaveLength(4);
  });

  test('Knight can jump over pieces', () => {
    // Knight at (0,0), surrounded by pieces, target at L-shape
    const board = createBoard([
      { row: 0, col: 0, piece: 'N' },
      { row: 0, col: 1, piece: 'P' }, // adjacent (blocking for sliding pieces)
      { row: 1, col: 0, piece: 'P' }, // adjacent
      { row: 1, col: 1, piece: 'P' }, // adjacent diagonal
      { row: 2, col: 1, piece: 'P' }, // L-shape target (2 down, 1 right)
      { row: 1, col: 2, piece: 'P' }, // L-shape target (1 down, 2 right)
    ]);

    const captures = getValidCaptures(board, 0, 0);
    expect(captures).toHaveLength(2);
    expect(captures).toContainEqual({ row: 2, col: 1 });
    expect(captures).toContainEqual({ row: 1, col: 2 });
  });

  test('Knight in corner has limited moves', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'N' },
      { row: 2, col: 1, piece: 'P' },
      { row: 1, col: 2, piece: 'P' },
    ]);

    const captures = getValidCaptures(board, 0, 0);
    expect(captures).toHaveLength(2);
  });
});

describe('Engine - Pawn Captures', () => {
  test('Pawn can capture diagonally forward (toward row 0)', () => {
    const board = createBoard([
      { row: 2, col: 1, piece: 'P' },
      { row: 1, col: 0, piece: 'Q' }, // diagonal forward-left
      { row: 1, col: 2, piece: 'Q' }, // diagonal forward-right
    ]);

    const captures = getValidCaptures(board, 2, 1);
    expect(captures).toHaveLength(2);
    expect(captures).toContainEqual({ row: 1, col: 0 });
    expect(captures).toContainEqual({ row: 1, col: 2 });
  });

  test('Pawn cannot capture backward', () => {
    const board = createBoard([
      { row: 1, col: 1, piece: 'P' },
      { row: 2, col: 0, piece: 'Q' }, // backward diagonal - should not be capturable
      { row: 2, col: 2, piece: 'Q' }, // backward diagonal
    ]);

    const captures = getValidCaptures(board, 1, 1);
    expect(captures).toHaveLength(0);
  });

  test('Pawn cannot capture forward (non-diagonal)', () => {
    const board = createBoard([
      { row: 2, col: 1, piece: 'P' },
      { row: 1, col: 1, piece: 'Q' }, // directly forward - should not be capturable
    ]);

    const captures = getValidCaptures(board, 2, 1);
    expect(captures).toHaveLength(0);
  });

  test('Pawn at row 0 has no forward captures', () => {
    const board = createBoard([
      { row: 0, col: 1, piece: 'P' },
      { row: 1, col: 0, piece: 'Q' }, // behind - not capturable
    ]);

    const captures = getValidCaptures(board, 0, 1);
    expect(captures).toHaveLength(0);
  });
});

describe('Engine - isValidCapture', () => {
  test('Returns true for valid captures', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
      { row: 0, col: 1, piece: 'P' },
    ]);

    expect(isValidCapture(board, 0, 0, 0, 1)).toBe(true);
  });

  test('Returns false for invalid captures', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
      { row: 0, col: 3, piece: 'P' }, // too far for king
    ]);

    expect(isValidCapture(board, 0, 0, 0, 3)).toBe(false);
  });

  test('Returns false for empty source square', () => {
    const board = createBoard([
      { row: 0, col: 1, piece: 'P' },
    ]);

    expect(isValidCapture(board, 0, 0, 0, 1)).toBe(false);
  });

  test('Returns false for empty destination square', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
    ]);

    expect(isValidCapture(board, 0, 0, 0, 1)).toBe(false);
  });
});

describe('Engine - executeCapture', () => {
  test('Moves piece and captures target', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
      { row: 0, col: 1, piece: 'P' },
    ]);

    const newBoard = executeCapture(board, 0, 0, 0, 1);

    expect(newBoard[0][0]).toBeNull();
    expect(newBoard[0][1]).toBe('K');
  });

  test('Does not modify original board', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
      { row: 0, col: 1, piece: 'P' },
    ]);

    executeCapture(board, 0, 0, 0, 1);

    expect(board[0][0]).toBe('K');
    expect(board[0][1]).toBe('P');
  });
});

describe('Engine - getAllValidMoves', () => {
  test('Returns all valid moves for all pieces', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
      { row: 0, col: 1, piece: 'P' },
      { row: 1, col: 1, piece: 'Q' },
    ]);

    const moves = getAllValidMoves(board);

    // King can capture P at (0,1), Q at (1,1)
    // P can capture Q diagonally (if forward diagonal exists) - P at (0,1) cannot move forward
    // Q at (1,1) can capture K and P
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.some(m => m.piece === 'K')).toBe(true);
    expect(moves.some(m => m.piece === 'Q')).toBe(true);
  });

  test('Returns empty array for empty board', () => {
    const board = createEmptyBoard();
    const moves = getAllValidMoves(board);
    expect(moves).toHaveLength(0);
  });

  test('Returns empty array when no captures possible', () => {
    // Single piece - no captures
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
    ]);

    const moves = getAllValidMoves(board);
    expect(moves).toHaveLength(0);
  });
});

describe('Engine - isSolved', () => {
  test('Returns true when only one piece remains', () => {
    const board = createBoard([
      { row: 2, col: 2, piece: 'K' },
    ]);

    expect(isSolved(board)).toBe(true);
  });

  test('Returns false when multiple pieces remain', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
      { row: 0, col: 1, piece: 'P' },
    ]);

    expect(isSolved(board)).toBe(false);
  });

  test('Returns false for empty board', () => {
    const board = createEmptyBoard();
    expect(isSolved(board)).toBe(false);
  });
});

describe('Engine - isStuck', () => {
  test('Returns true when no moves available but pieces remain', () => {
    // Two pieces that cannot capture each other
    const board = createBoard([
      { row: 0, col: 0, piece: 'P' }, // Pawn at top row
      { row: 3, col: 3, piece: 'P' }, // Pawn at bottom corner
    ]);

    expect(isStuck(board)).toBe(true);
  });

  test('Returns false when moves are available', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
      { row: 0, col: 1, piece: 'P' },
    ]);

    expect(isStuck(board)).toBe(false);
  });

  test('Returns false when puzzle is solved', () => {
    const board = createBoard([
      { row: 0, col: 0, piece: 'K' },
    ]);

    expect(isStuck(board)).toBe(false);
  });
});

describe('Engine - Edge Cases', () => {
  test('Empty square returns no captures', () => {
    const board = createBoard([
      { row: 0, col: 1, piece: 'P' },
    ]);

    const captures = getValidCaptures(board, 0, 0);
    expect(captures).toHaveLength(0);
  });

  test('Unknown piece type returns no captures', () => {
    const board = createEmptyBoard();
    board[0][0] = 'X'; // Invalid piece

    const captures = getValidCaptures(board, 0, 0);
    expect(captures).toHaveLength(0);
  });
});
