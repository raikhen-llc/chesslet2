"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Square from "./Square";
import { PIECE_IMAGES } from "@/lib/constants";
import { getValidCaptures } from "@/lib/engine";

/**
 * Board component - The 4x4 chess board with drag-and-drop
 */
export default function Board({ board, onMove, disabled, animatingMove }) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validTargets, setValidTargets] = useState([]);
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState(null);
  const [returningPiece, setReturningPiece] = useState(null);
  const boardRef = useRef(null);

  // Get square size based on board dimensions
  const getSquareSize = useCallback(() => {
    if (!boardRef.current) return 80;
    return boardRef.current.offsetWidth / 4;
  }, []);

  // Convert pixel position to board coordinates
  const positionToSquare = useCallback((x, y) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 4;
    const col = Math.floor((x - rect.left) / squareSize);
    const row = Math.floor((y - rect.top) / squareSize);
    if (row >= 0 && row < 4 && col >= 0 && col < 4) {
      return { row, col };
    }
    return null;
  }, []);

  // Get pixel position for a square (center)
  const squareToPosition = useCallback((row, col) => {
    if (!boardRef.current) return { x: 0, y: 0 };
    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 4;
    return {
      x: rect.left + col * squareSize + squareSize / 2,
      y: rect.top + row * squareSize + squareSize / 2,
    };
  }, []);

  // Handle starting a drag
  const handleDragStart = useCallback(
    (row, col, clientX, clientY) => {
      if (disabled) return;

      const piece = board[row][col];
      if (!piece) return;

      setSelectedSquare({ row, col });
      setDraggingPiece({ piece, row, col });
      setDragPosition({ x: clientX, y: clientY });

      // Get valid capture targets
      const captures = getValidCaptures(board, row, col);
      setValidTargets(captures);
    },
    [board, disabled]
  );

  // Handle drag movement
  const handleDragMove = useCallback(
    (clientX, clientY) => {
      if (!draggingPiece) return;

      setDragPosition({ x: clientX, y: clientY });

      // Check which square we're over
      const square = positionToSquare(clientX, clientY);
      if (
        square &&
        validTargets.some((t) => t.row === square.row && t.col === square.col)
      ) {
        setDropTarget(square);
      } else {
        setDropTarget(null);
      }
    },
    [draggingPiece, positionToSquare, validTargets]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (clientX, clientY) => {
      if (!draggingPiece) return;

      const square = positionToSquare(clientX, clientY);
      const isValidDrop =
        square &&
        validTargets.some((t) => t.row === square.row && t.col === square.col);

      if (isValidDrop) {
        // Valid drop - execute move
        if (onMove) {
          onMove(draggingPiece.row, draggingPiece.col, square.row, square.col);
        }
        setDraggingPiece(null);
        setSelectedSquare(null);
        setValidTargets([]);
        setDropTarget(null);
      } else {
        // Invalid drop - animate back
        const startPos = squareToPosition(draggingPiece.row, draggingPiece.col);
        setReturningPiece({
          piece: draggingPiece.piece,
          row: draggingPiece.row,
          col: draggingPiece.col,
          fromX: clientX,
          fromY: clientY,
          toX: startPos.x,
          toY: startPos.y,
        });
        setDraggingPiece(null);
        setDropTarget(null);

        // Clear returning animation after it completes
        setTimeout(() => {
          setReturningPiece(null);
          setSelectedSquare(null);
          setValidTargets([]);
        }, 200);
      }
    },
    [draggingPiece, validTargets, positionToSquare, squareToPosition, onMove]
  );

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e, row, col) => {
      e.preventDefault();
      handleDragStart(row, col, e.clientX, e.clientY);
    },
    [handleDragStart]
  );

  const handleMouseMove = useCallback(
    (e) => {
      handleDragMove(e.clientX, e.clientY);
    },
    [handleDragMove]
  );

  const handleMouseUp = useCallback(
    (e) => {
      handleDragEnd(e.clientX, e.clientY);
    },
    [handleDragEnd]
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e, row, col) => {
      if (e.touches.length !== 1) return;
      e.preventDefault(); // Prevent browser default touch behavior (scrolling, context menu)
      const touch = e.touches[0];
      handleDragStart(row, col, touch.clientX, touch.clientY);
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    },
    [handleDragMove]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      if (e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      handleDragEnd(touch.clientX, touch.clientY);
    },
    [handleDragEnd]
  );

  // Add global mouse/touch listeners when dragging
  useEffect(() => {
    if (draggingPiece) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [
    draggingPiece,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Check if a square is a valid target
  const isValidTarget = useCallback(
    (row, col) => {
      return validTargets.some((t) => t.row === row && t.col === col);
    },
    [validTargets]
  );

  // Check if square is selected
  const isSelected = useCallback(
    (row, col) => {
      return (
        selectedSquare &&
        selectedSquare.row === row &&
        selectedSquare.col === col
      );
    },
    [selectedSquare]
  );

  // Check if square is being dragged from
  const isDragging = useCallback(
    (row, col) => {
      return (
        draggingPiece && draggingPiece.row === row && draggingPiece.col === col
      );
    },
    [draggingPiece]
  );

  // Check if square is being hovered as drop target
  const isDropTarget = useCallback(
    (row, col) => {
      return dropTarget && dropTarget.row === row && dropTarget.col === col;
    },
    [dropTarget]
  );

  // Get corner radius class for square
  const getCornerClass = (row, col) => {
    if (row === 0 && col === 0) return "rounded-tl-[12px]";
    if (row === 0 && col === 3) return "rounded-tr-[12px]";
    if (row === 3 && col === 0) return "rounded-bl-[12px]";
    if (row === 3 && col === 3) return "rounded-br-[12px]";
    return "";
  };

  return (
    <div className="board-container">
      <div
        ref={boardRef}
        className={`
          grid grid-cols-4 grid-rows-4
          w-full h-auto aspect-square
          ${disabled ? "pointer-events-none opacity-90" : ""}
          select-none
        `}
      >
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            // Hide piece if: being dragged, returning from drag, source of animation, OR target of animation (captured piece)
            const hidePiece =
              isDragging(rowIndex, colIndex) ||
              (returningPiece &&
                returningPiece.row === rowIndex &&
                returningPiece.col === colIndex) ||
              (animatingMove &&
                animatingMove.from.row === rowIndex &&
                animatingMove.from.col === colIndex) ||
              (animatingMove &&
                animatingMove.to.row === rowIndex &&
                animatingMove.to.col === colIndex);

            return (
              <Square
                key={`${rowIndex}-${colIndex}`}
                row={rowIndex}
                col={colIndex}
                piece={hidePiece ? null : piece}
                isLight={isLight}
                isSelected={isSelected(rowIndex, colIndex)}
                isValidTarget={isValidTarget(rowIndex, colIndex)}
                isDropTarget={isDropTarget(rowIndex, colIndex)}
                isAnimationTarget={
                  animatingMove &&
                  animatingMove.to.row === rowIndex &&
                  animatingMove.to.col === colIndex
                }
                onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex)}
                onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                cornerClass={getCornerClass(rowIndex, colIndex)}
              />
            );
          })
        )}
      </div>

      {/* Dragging piece overlay */}
      {draggingPiece && (
        <DraggingPiece
          piece={draggingPiece.piece}
          x={dragPosition.x}
          y={dragPosition.y}
          size={getSquareSize()}
        />
      )}

      {/* Returning piece animation */}
      {returningPiece && (
        <ReturningPiece
          piece={returningPiece.piece}
          fromX={returningPiece.fromX}
          fromY={returningPiece.fromY}
          toX={returningPiece.toX}
          toY={returningPiece.toY}
          size={getSquareSize()}
        />
      )}

      {/* Solution animation piece */}
      {animatingMove &&
        board[animatingMove.from.row][animatingMove.from.col] && (
          <SolutionAnimatingPiece
            piece={board[animatingMove.from.row][animatingMove.from.col]}
            fromRow={animatingMove.from.row}
            fromCol={animatingMove.from.col}
            toRow={animatingMove.to.row}
            toCol={animatingMove.to.col}
            boardRef={boardRef}
          />
        )}
    </div>
  );
}

/**
 * Dragging piece - follows the cursor
 */
function DraggingPiece({ piece, x, y, size }) {
  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: x,
        top: y,
        width: size * 0.85,
        height: size * 0.85,
        transform: "translate(-50%, -50%) scale(1.1)",
        filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))",
      }}
    >
      <img
        src={PIECE_IMAGES[piece]}
        alt={piece}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}

/**
 * Returning piece - animates back to original position
 */
function ReturningPiece({ piece, fromX, fromY, toX, toY, size }) {
  return (
    <div
      className="fixed pointer-events-none z-50 returning-piece"
      style={{
        "--from-x": `${fromX}px`,
        "--from-y": `${fromY}px`,
        "--to-x": `${toX}px`,
        "--to-y": `${toY}px`,
        width: size * 0.85,
        height: size * 0.85,
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
      }}
    >
      <img
        src={PIECE_IMAGES[piece]}
        alt={piece}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}

/**
 * Solution animating piece - moves from one square to another during solution playback
 */
function SolutionAnimatingPiece({
  piece,
  fromRow,
  fromCol,
  toRow,
  toCol,
  boardRef,
}) {
  const [positions, setPositions] = useState({
    from: null,
    to: null,
    size: 80,
  });

  useEffect(() => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const squareSize = rect.width / 4;
      setPositions({
        from: {
          x: rect.left + fromCol * squareSize + squareSize / 2,
          y: rect.top + fromRow * squareSize + squareSize / 2,
        },
        to: {
          x: rect.left + toCol * squareSize + squareSize / 2,
          y: rect.top + toRow * squareSize + squareSize / 2,
        },
        size: squareSize,
      });
    }
  }, [boardRef, fromRow, fromCol, toRow, toCol]);

  if (!positions.from || !positions.to) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 solution-piece"
      style={{
        "--from-x": `${positions.from.x}px`,
        "--from-y": `${positions.from.y}px`,
        "--to-x": `${positions.to.x}px`,
        "--to-y": `${positions.to.y}px`,
        width: positions.size * 0.85,
        height: positions.size * 0.85,
        filter: "drop-shadow(0 6px 12px rgba(139, 92, 246, 0.4))",
      }}
    >
      <img
        src={PIECE_IMAGES[piece]}
        alt={piece}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}
