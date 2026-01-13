"use client";

import { useState, useCallback, forwardRef } from "react";
import { PIECES, PIECE_IMAGES } from "@/lib/constants";

/**
 * DesignerBoard - A board for designing custom puzzles
 * Supports drag-and-drop for placing and moving pieces
 */
const DesignerBoard = forwardRef(function DesignerBoard(
  { board, onBoardChange, onPieceDragStart, draggingPiece },
  ref
) {
  const [hoveredSquare, setHoveredSquare] = useState(null);

  // Handle clicking a square (optional: keep remove functionality or just for debugging)
  const handleSquareClick = useCallback(
    (row, col) => {
      const currentPiece = board[row][col];
      // Optional: Click to remove is still a quick way to delete
      if (currentPiece) {
        const newBoard = board.map((r, ri) =>
          r.map((c, ci) => (ri === row && ci === col ? null : c))
        );
        onBoardChange(newBoard);
      }
    },
    [board, onBoardChange]
  );

  const handleMouseDown = (e, row, col) => {
    const piece = board[row][col];
    if (piece) {
      e.preventDefault(); // Prevent text selection/image drag
      onPieceDragStart({ piece, row, col, type: "board" }, e);
    }
  };

  const handleTouchStart = (e, row, col) => {
    const piece = board[row][col];
    if (piece && e.touches.length === 1) {
      e.preventDefault(); // Prevent browser default touch behavior for drag
      onPieceDragStart({ piece, row, col, type: "board" }, e.touches[0]);
    }
  };

  const getCornerClass = (row, col) => {
    if (row === 0 && col === 0) return "corner-tl";
    if (row === 0 && col === 3) return "corner-tr";
    if (row === 3 && col === 0) return "corner-bl";
    if (row === 3 && col === 3) return "corner-br";
    return "";
  };

  return (
    <div className="designer-board-container">
      <div className="designer-board" ref={ref}>
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isHovered =
              hoveredSquare?.row === rowIndex &&
              hoveredSquare?.col === colIndex;

            // Hide piece if it's the one being dragged from the board
            const isBeingDragged =
              draggingPiece?.type === "board" &&
              draggingPiece?.row === rowIndex &&
              draggingPiece?.col === colIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  designer-square
                  ${isLight ? "square-light" : "square-dark"}
                  ${getCornerClass(rowIndex, colIndex)}
                  ${piece ? "has-piece" : ""}
                  touch-none select-none
                `}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex)}
                onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                onMouseEnter={() =>
                  setHoveredSquare({ row: rowIndex, col: colIndex })
                }
                onMouseLeave={() => setHoveredSquare(null)}
              >
                {piece && !isBeingDragged && (
                  <img
                    src={PIECE_IMAGES[piece]}
                    alt={piece}
                    className="piece-image"
                    draggable={false}
                    width={68}
                    height={68}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

export default DesignerBoard;

/**
 * Piece Palette - Allows dragging a piece to place
 */
export function PiecePalette({ onPieceDragStart }) {
  const handleMouseDown = (e, piece) => {
    e.preventDefault();
    onPieceDragStart({ piece, type: "palette" }, e);
  };

  const handleTouchStart = (e, piece) => {
    if (e.touches.length === 1) {
      e.preventDefault(); // Prevent browser default touch behavior for drag
      onPieceDragStart({ piece, type: "palette" }, e.touches[0]);
    }
  };

  return (
    <div className="piece-palette">
      <div className="palette-label">Drag pieces to the board</div>
      <div className="palette-grid">
        {PIECES.map((piece) => (
          <div
            key={piece}
            className="palette-piece touch-none select-none"
            onMouseDown={(e) => handleMouseDown(e, piece)}
            onTouchStart={(e) => handleTouchStart(e, piece)}
            title={getPieceName(piece)}
          >
            <img
              src={PIECE_IMAGES[piece]}
              alt={piece}
              className="palette-image"
              draggable={false}
              width={40}
              height={40}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function getPieceName(piece) {
  const names = {
    K: "King",
    Q: "Queen",
    R: "Rook",
    B: "Bishop",
    N: "Knight",
    P: "Pawn",
  };
  return names[piece] || piece;
}
