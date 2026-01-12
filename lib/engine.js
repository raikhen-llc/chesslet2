/**
 * Chess move validation engine for Chesslet
 * 
 * All moves in Chesslet MUST be captures - pieces can only move to
 * squares occupied by other pieces.
 */

import { BOARD_SIZE } from "./constants.js";


/**
 * Check if a position is within the board bounds
 * @param {number} row 
 * @param {number} col 
 * @returns {boolean}
 */
function isInBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * Check if there's a piece at the given position
 * @param {Array<Array<string|null>>} board 
 * @param {number} row 
 * @param {number} col 
 * @returns {boolean}
 */
function hasPiece(board, row, col) {
  return isInBounds(row, col) && board[row][col] !== null;
}

/**
 * Check if the path between two positions is clear (for sliding pieces)
 * @param {Array<Array<string|null>>} board 
 * @param {number} fromRow 
 * @param {number} fromCol 
 * @param {number} toRow 
 * @param {number} toCol 
 * @returns {boolean}
 */
function isPathClear(board, fromRow, fromCol, toRow, toCol) {
  const rowDir = Math.sign(toRow - fromRow);
  const colDir = Math.sign(toCol - fromCol);
  
  let row = fromRow + rowDir;
  let col = fromCol + colDir;
  
  while (row !== toRow || col !== toCol) {
    if (board[row][col] !== null) {
      return false;
    }
    row += rowDir;
    col += colDir;
  }
  
  return true;
}

/**
 * Get valid captures for a King
 * King can move one square in any direction
 * @param {Array<Array<string|null>>} board 
 * @param {number} row 
 * @param {number} col 
 * @returns {Array<{row: number, col: number}>}
 */
function getKingCaptures(board, row, col) {
  const captures = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1],  [1, 0], [1, 1]
  ];
  
  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    if (hasPiece(board, newRow, newCol)) {
      captures.push({ row: newRow, col: newCol });
    }
  }
  
  return captures;
}

/**
 * Get valid captures for a Queen
 * Queen can move any distance in any direction (diagonal or orthogonal)
 * @param {Array<Array<string|null>>} board 
 * @param {number} row 
 * @param {number} col 
 * @returns {Array<{row: number, col: number}>}
 */
function getQueenCaptures(board, row, col) {
  // Queen combines Rook and Bishop movement
  return [...getRookCaptures(board, row, col), ...getBishopCaptures(board, row, col)];
}

/**
 * Get valid captures for a Rook
 * Rook can move any distance orthogonally (horizontal/vertical)
 * @param {Array<Array<string|null>>} board 
 * @param {number} row 
 * @param {number} col 
 * @returns {Array<{row: number, col: number}>}
 */
function getRookCaptures(board, row, col) {
  const captures = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (const [dRow, dCol] of directions) {
    for (let dist = 1; dist < BOARD_SIZE; dist++) {
      const newRow = row + dRow * dist;
      const newCol = col + dCol * dist;
      
      if (!isInBounds(newRow, newCol)) break;
      
      if (board[newRow][newCol] !== null) {
        // Found a piece - this is a valid capture, but can't go further
        captures.push({ row: newRow, col: newCol });
        break;
      }
    }
  }
  
  return captures;
}

/**
 * Get valid captures for a Bishop
 * Bishop can move any distance diagonally
 * @param {Array<Array<string|null>>} board 
 * @param {number} row 
 * @param {number} col 
 * @returns {Array<{row: number, col: number}>}
 */
function getBishopCaptures(board, row, col) {
  const captures = [];
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  
  for (const [dRow, dCol] of directions) {
    for (let dist = 1; dist < BOARD_SIZE; dist++) {
      const newRow = row + dRow * dist;
      const newCol = col + dCol * dist;
      
      if (!isInBounds(newRow, newCol)) break;
      
      if (board[newRow][newCol] !== null) {
        // Found a piece - this is a valid capture, but can't go further
        captures.push({ row: newRow, col: newCol });
        break;
      }
    }
  }
  
  return captures;
}

/**
 * Get valid captures for a Knight
 * Knight moves in an L-shape (2 squares in one direction, 1 in perpendicular)
 * Knights can jump over other pieces
 * @param {Array<Array<string|null>>} board 
 * @param {number} row 
 * @param {number} col 
 * @returns {Array<{row: number, col: number}>}
 */
function getKnightCaptures(board, row, col) {
  const captures = [];
  const moves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  for (const [dRow, dCol] of moves) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    if (hasPiece(board, newRow, newCol)) {
      captures.push({ row: newRow, col: newCol });
    }
  }
  
  return captures;
}

/**
 * Get valid captures for a Pawn
 * In Chesslet, pawns can only capture diagonally (no forward movement)
 * Pawns move "up" the board (toward row 0) - no promotion
 * @param {Array<Array<string|null>>} board 
 * @param {number} row 
 * @param {number} col 
 * @returns {Array<{row: number, col: number}>}
 */
function getPawnCaptures(board, row, col) {
  const captures = [];
  
  // Pawns capture diagonally forward only (toward row 0)
  const captureSquares = [
    [row - 1, col - 1], // up-left
    [row - 1, col + 1], // up-right
  ];
  
  for (const [newRow, newCol] of captureSquares) {
    if (hasPiece(board, newRow, newCol)) {
      captures.push({ row: newRow, col: newCol });
    }
  }
  
  return captures;
}

/**
 * Get all valid captures for a piece at a given position
 * @param {Array<Array<string|null>>} board 
 * @param {number} row 
 * @param {number} col 
 * @returns {Array<{row: number, col: number}>}
 */
export function getValidCaptures(board, row, col) {
  const piece = board[row][col];
  
  if (!piece) return [];
  
  switch (piece) {
    case 'K': return getKingCaptures(board, row, col);
    case 'Q': return getQueenCaptures(board, row, col);
    case 'R': return getRookCaptures(board, row, col);
    case 'B': return getBishopCaptures(board, row, col);
    case 'N': return getKnightCaptures(board, row, col);
    case 'P': return getPawnCaptures(board, row, col);
    default: return [];
  }
}

/**
 * Check if a move is a valid capture
 * @param {Array<Array<string|null>>} board 
 * @param {number} fromRow 
 * @param {number} fromCol 
 * @param {number} toRow 
 * @param {number} toCol 
 * @returns {boolean}
 */
export function isValidCapture(board, fromRow, fromCol, toRow, toCol) {
  const captures = getValidCaptures(board, fromRow, fromCol);
  return captures.some(c => c.row === toRow && c.col === toCol);
}

/**
 * Execute a capture move and return the new board state
 * @param {Array<Array<string|null>>} board 
 * @param {number} fromRow 
 * @param {number} fromCol 
 * @param {number} toRow 
 * @param {number} toCol 
 * @returns {Array<Array<string|null>>} New board state
 */
export function executeCapture(board, fromRow, fromCol, toRow, toCol) {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[fromRow][fromCol];
  
  newBoard[fromRow][fromCol] = null;
  newBoard[toRow][toCol] = piece;
  
  return newBoard;
}

/**
 * Get all valid moves on the current board
 * @param {Array<Array<string|null>>} board 
 * @returns {Array<{from: {row: number, col: number}, to: {row: number, col: number}, piece: string}>}
 */
export function getAllValidMoves(board) {
  const moves = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece) {
        const captures = getValidCaptures(board, row, col);
        for (const capture of captures) {
          moves.push({
            from: { row, col },
            to: capture,
            piece
          });
        }
      }
    }
  }
  
  return moves;
}

/**
 * Check if the puzzle is solved (only one piece remaining)
 * @param {Array<Array<string|null>>} board 
 * @returns {boolean}
 */
export function isSolved(board) {
  let pieceCount = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) pieceCount++;
    }
  }
  return pieceCount === 1;
}

/**
 * Check if the game is stuck (no valid moves but more than one piece)
 * @param {Array<Array<string|null>>} board 
 * @returns {boolean}
 */
export function isStuck(board) {
  const moves = getAllValidMoves(board);
  const pieceCount = board.flat().filter(p => p !== null).length;
  return moves.length === 0 && pieceCount > 1;
}
