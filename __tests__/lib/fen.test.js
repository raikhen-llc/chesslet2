/**
 * Tests for lib/fen.js - FEN encoding/decoding for 4x4 Chesslet board
 */

import {
  boardToFen,
  fenToBoard,
  fenToUrl,
  urlToFen,
  countPieces,
  getPiecePositions,
  cloneBoard,
  isValidFen,
  createEmptyBoard,
} from '../../lib/fen';

describe('FEN - boardToFen', () => {
  test('Converts empty board to FEN', () => {
    const board = createEmptyBoard();
    const fen = boardToFen(board);
    expect(fen).toBe('4/4/4/4');
  });

  test('Converts board with single piece', () => {
    const board = createEmptyBoard();
    board[0][0] = 'K';
    const fen = boardToFen(board);
    expect(fen).toBe('K3/4/4/4');
  });

  test('Converts board with multiple pieces in a row', () => {
    const board = createEmptyBoard();
    board[0][0] = 'K';
    board[0][1] = 'Q';
    board[0][2] = 'R';
    const fen = boardToFen(board);
    expect(fen).toBe('KQR1/4/4/4');
  });

  test('Converts full first row', () => {
    const board = createEmptyBoard();
    board[0][0] = 'K';
    board[0][1] = 'Q';
    board[0][2] = 'R';
    board[0][3] = 'B';
    const fen = boardToFen(board);
    expect(fen).toBe('KQRB/4/4/4');
  });

  test('Handles pieces with gaps', () => {
    const board = createEmptyBoard();
    board[0][0] = 'K';
    board[0][3] = 'Q';
    const fen = boardToFen(board);
    expect(fen).toBe('K2Q/4/4/4');
  });

  test('Handles multiple rows with pieces', () => {
    const board = createEmptyBoard();
    board[0][0] = 'K';
    board[1][1] = 'Q';
    board[2][2] = 'R';
    board[3][3] = 'B';
    const fen = boardToFen(board);
    expect(fen).toBe('K3/1Q2/2R1/3B');
  });

  test('Handles all piece types', () => {
    const board = createEmptyBoard();
    board[0][0] = 'K';
    board[0][1] = 'Q';
    board[1][0] = 'R';
    board[1][1] = 'B';
    board[2][0] = 'N';
    board[2][1] = 'P';
    const fen = boardToFen(board);
    expect(fen).toBe('KQ2/RB2/NP2/4');
  });
});

describe('FEN - fenToBoard', () => {
  test('Parses empty board FEN', () => {
    const board = fenToBoard('4/4/4/4');
    expect(board).toHaveLength(4);
    expect(board.every(row => row.every(cell => cell === null))).toBe(true);
  });

  test('Parses board with single piece', () => {
    const board = fenToBoard('K3/4/4/4');
    expect(board[0][0]).toBe('K');
    expect(board[0][1]).toBeNull();
    expect(board[0][2]).toBeNull();
    expect(board[0][3]).toBeNull();
  });

  test('Parses board with multiple pieces in a row', () => {
    const board = fenToBoard('KQR1/4/4/4');
    expect(board[0][0]).toBe('K');
    expect(board[0][1]).toBe('Q');
    expect(board[0][2]).toBe('R');
    expect(board[0][3]).toBeNull();
  });

  test('Parses full first row', () => {
    const board = fenToBoard('KQRB/4/4/4');
    expect(board[0][0]).toBe('K');
    expect(board[0][1]).toBe('Q');
    expect(board[0][2]).toBe('R');
    expect(board[0][3]).toBe('B');
  });

  test('Parses pieces with gaps', () => {
    const board = fenToBoard('K2Q/4/4/4');
    expect(board[0][0]).toBe('K');
    expect(board[0][1]).toBeNull();
    expect(board[0][2]).toBeNull();
    expect(board[0][3]).toBe('Q');
  });

  test('Parses URL-safe FEN (dashes instead of slashes)', () => {
    const board = fenToBoard('K3-4-4-4');
    expect(board[0][0]).toBe('K');
    expect(board[1].every(cell => cell === null)).toBe(true);
  });

  test('Throws error for invalid row count', () => {
    expect(() => fenToBoard('K3/4/4')).toThrow('expected 4 rows');
  });

  test('Throws error for invalid character', () => {
    expect(() => fenToBoard('X3/4/4/4')).toThrow('Invalid FEN character');
  });

  test('Throws error for wrong row length', () => {
    expect(() => fenToBoard('K5/4/4/4')).toThrow('Invalid FEN character');
  });
});

describe('FEN - Round-trip encoding/decoding', () => {
  test('Board survives round-trip conversion', () => {
    const original = createEmptyBoard();
    original[0][0] = 'K';
    original[1][2] = 'Q';
    original[3][3] = 'P';

    const fen = boardToFen(original);
    const restored = fenToBoard(fen);

    expect(restored).toEqual(original);
  });

  test('FEN survives round-trip conversion', () => {
    const original = 'KQR1/2B1/N3/PP2';
    const board = fenToBoard(original);
    const restored = boardToFen(board);

    expect(restored).toBe(original);
  });

  test('Empty board survives round-trip', () => {
    const original = createEmptyBoard();
    const fen = boardToFen(original);
    const restored = fenToBoard(fen);

    expect(restored).toEqual(original);
  });
});

describe('FEN - URL conversion', () => {
  test('fenToUrl replaces slashes with dashes', () => {
    const fen = 'K3/4/4/4';
    const urlFen = fenToUrl(fen);
    expect(urlFen).toBe('K3-4-4-4');
    expect(urlFen).not.toContain('/');
  });

  test('urlToFen replaces dashes with slashes', () => {
    const urlFen = 'K3-4-4-4';
    const fen = urlToFen(urlFen);
    expect(fen).toBe('K3/4/4/4');
    expect(fen).not.toContain('-');
  });

  test('URL conversion round-trip', () => {
    const original = 'KQR1/2B1/N3/PP2';
    const urlFen = fenToUrl(original);
    const restored = urlToFen(urlFen);
    expect(restored).toBe(original);
  });
});

describe('FEN - countPieces', () => {
  test('Returns 0 for empty board', () => {
    const board = createEmptyBoard();
    expect(countPieces(board)).toBe(0);
  });

  test('Counts single piece', () => {
    const board = createEmptyBoard();
    board[0][0] = 'K';
    expect(countPieces(board)).toBe(1);
  });

  test('Counts multiple pieces', () => {
    const board = createEmptyBoard();
    board[0][0] = 'K';
    board[1][1] = 'Q';
    board[2][2] = 'R';
    board[3][3] = 'B';
    expect(countPieces(board)).toBe(4);
  });

  test('Counts full board', () => {
    const board = fenToBoard('KQRB/NNPP/KQRB/NNPP');
    expect(countPieces(board)).toBe(16);
  });
});

describe('FEN - getPiecePositions', () => {
  test('Returns empty array for empty board', () => {
    const board = createEmptyBoard();
    const positions = getPiecePositions(board);
    expect(positions).toHaveLength(0);
  });

  test('Returns position for single piece', () => {
    const board = createEmptyBoard();
    board[2][3] = 'K';
    const positions = getPiecePositions(board);
    expect(positions).toHaveLength(1);
    expect(positions[0]).toEqual({ row: 2, col: 3, piece: 'K' });
  });

  test('Returns all positions for multiple pieces', () => {
    const board = createEmptyBoard();
    board[0][0] = 'K';
    board[1][2] = 'Q';
    board[3][1] = 'P';

    const positions = getPiecePositions(board);
    expect(positions).toHaveLength(3);
    expect(positions).toContainEqual({ row: 0, col: 0, piece: 'K' });
    expect(positions).toContainEqual({ row: 1, col: 2, piece: 'Q' });
    expect(positions).toContainEqual({ row: 3, col: 1, piece: 'P' });
  });
});

describe('FEN - cloneBoard', () => {
  test('Creates independent copy of board', () => {
    const original = createEmptyBoard();
    original[0][0] = 'K';

    const clone = cloneBoard(original);

    // Modify clone
    clone[0][0] = 'Q';

    // Original should be unchanged
    expect(original[0][0]).toBe('K');
    expect(clone[0][0]).toBe('Q');
  });

  test('Clone equals original before modification', () => {
    const original = createEmptyBoard();
    original[0][0] = 'K';
    original[1][1] = 'Q';

    const clone = cloneBoard(original);

    expect(clone).toEqual(original);
  });

  test('Modifying original does not affect clone', () => {
    const original = createEmptyBoard();
    original[0][0] = 'K';

    const clone = cloneBoard(original);
    original[0][0] = 'Q';

    expect(clone[0][0]).toBe('K');
  });
});

describe('FEN - isValidFen', () => {
  test('Returns true for valid FEN strings', () => {
    expect(isValidFen('4/4/4/4')).toBe(true);
    expect(isValidFen('K3/4/4/4')).toBe(true);
    expect(isValidFen('KQRB/NNPP/KQRB/NNPP')).toBe(true);
    expect(isValidFen('K2Q/1B2/2R1/3N')).toBe(true);
  });

  test('Returns true for URL-safe FEN', () => {
    expect(isValidFen('K3-4-4-4')).toBe(true);
  });

  test('Returns false for invalid FEN strings', () => {
    expect(isValidFen('K3/4/4')).toBe(false); // Too few rows
    expect(isValidFen('X3/4/4/4')).toBe(false); // Invalid character
    expect(isValidFen('K5/4/4/4')).toBe(false); // Row too long
    expect(isValidFen('')).toBe(false); // Empty string
    expect(isValidFen('invalid')).toBe(false); // Completely invalid
  });
});

describe('FEN - createEmptyBoard', () => {
  test('Creates 4x4 board', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(4);
    expect(board.every(row => row.length === 4)).toBe(true);
  });

  test('All cells are null', () => {
    const board = createEmptyBoard();
    expect(board.every(row => row.every(cell => cell === null))).toBe(true);
  });

  test('Each call creates independent board', () => {
    const board1 = createEmptyBoard();
    const board2 = createEmptyBoard();

    board1[0][0] = 'K';

    expect(board2[0][0]).toBeNull();
  });
});
