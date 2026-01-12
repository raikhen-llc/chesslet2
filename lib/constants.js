/**
 * Shared constants for Chesslet
 */

export const BOARD_SIZE = 4;

export const PIECE_IMAGES = {
  K: "/pieces/wK.svg",
  Q: "/pieces/wQ.svg",
  R: "/pieces/wR.svg",
  B: "/pieces/wB.svg",
  N: "/pieces/wN.svg",
  P: "/pieces/wP.svg",
};

export const PIECES = ["K", "Q", "R", "B", "N", "P"];

/**
 * Create an empty board
 */
export function createEmptyBoard() {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
}
