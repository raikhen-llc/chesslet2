/**
 * FEN encoding/decoding for 4x4 Chesslet board
 *
 * Format: Simplified FEN for 4x4 board
 * - Each row separated by '/' (or '-' for URL-safe)
 * - Pieces: K=King, Q=Queen, R=Rook, B=Bishop, N=Knight, P=Pawn
 * - Numbers represent consecutive empty squares
 *
 * Example: "KQR1/2B1/N3/PP2" =
 *   Row 0: King, Queen, Rook, empty
 *   Row 1: empty, empty, Bishop, empty
 *   Row 2: Knight, empty, empty, empty
 *   Row 3: Pawn, Pawn, empty, empty
 */

import { BOARD_SIZE, PIECES } from "./constants.js";

const PIECE_CHARS = PIECES;

/**
 * Convert board array to FEN string
 * @param {Array<Array<string|null>>} board - 4x4 board array
 * @returns {string} FEN string
 */
export function boardToFen(board) {
  const rows = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    let rowStr = "";
    let emptyCount = 0;

    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      if (piece) {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        rowStr += piece;
      } else {
        emptyCount++;
      }
    }

    if (emptyCount > 0) {
      rowStr += emptyCount;
    }

    rows.push(rowStr || "4"); // '4' means entire row is empty
  }

  return rows.join("/");
}

/**
 * Convert FEN string to board array
 * @param {string} fen - FEN string
 * @returns {Array<Array<string|null>>} 4x4 board array
 */
export function fenToBoard(fen) {
  // Handle URL-safe format (dashes instead of slashes)
  const normalizedFen = fen.replace(/-/g, "/");
  const rows = normalizedFen.split("/");

  if (rows.length !== BOARD_SIZE) {
    throw new Error(
      `Invalid FEN: expected ${BOARD_SIZE} rows, got ${rows.length}`
    );
  }

  const board = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    const boardRow = [];
    const rowStr = rows[row];

    for (const char of rowStr) {
      if (PIECE_CHARS.includes(char)) {
        boardRow.push(char);
      } else if (/[1-4]/.test(char)) {
        const emptyCount = parseInt(char, 10);
        for (let i = 0; i < emptyCount; i++) {
          boardRow.push(null);
        }
      } else {
        throw new Error(`Invalid FEN character: ${char}`);
      }
    }

    if (boardRow.length !== BOARD_SIZE) {
      throw new Error(
        `Invalid FEN: row ${row} has ${boardRow.length} squares, expected ${BOARD_SIZE}`
      );
    }

    board.push(boardRow);
  }

  return board;
}

/**
 * Convert FEN to URL-safe format
 * @param {string} fen - Standard FEN with slashes
 * @returns {string} URL-safe FEN with dashes
 */
export function fenToUrl(fen) {
  return fen.replace(/\//g, "-");
}

/**
 * Convert URL-safe FEN back to standard
 * @param {string} urlFen - URL-safe FEN with dashes
 * @returns {string} Standard FEN with slashes
 */
export function urlToFen(urlFen) {
  return urlFen.replace(/-/g, "/");
}

// Re-export createEmptyBoard from constants for backwards compatibility
export { createEmptyBoard } from "./constants.js";

/**
 * Count pieces on the board
 * @param {Array<Array<string|null>>} board
 * @returns {number}
 */
export function countPieces(board) {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) count++;
    }
  }
  return count;
}

/**
 * Get all piece positions on the board
 * @param {Array<Array<string|null>>} board
 * @returns {Array<{row: number, col: number, piece: string}>}
 */
export function getPiecePositions(board) {
  const positions = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) {
        positions.push({ row, col, piece: board[row][col] });
      }
    }
  }
  return positions;
}

/**
 * Deep clone a board
 * @param {Array<Array<string|null>>} board
 * @returns {Array<Array<string|null>>}
 */
export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

/**
 * Validate if a FEN string is valid
 * @param {string} fen
 * @returns {boolean}
 */
export function isValidFen(fen) {
  try {
    fenToBoard(fen);
    return true;
  } catch {
    return false;
  }
}

export { BOARD_SIZE as BOARD_SIZE_EXPORT } from "./constants.js";
