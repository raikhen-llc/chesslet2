"use client";

import Piece from "./Piece";

/**
 * Square component - A single square on the chess board
 */
export default function Square({
  row,
  col,
  piece,
  isLight,
  isSelected,
  isValidTarget,
  isDropTarget,
  isAnimationTarget,
  onMouseDown,
  onTouchStart,
  cornerClass = "",
}) {
  // Determine background color
  const getBgColor = () => {
    if (isAnimationTarget) {
      return "bg-[#c4b5fd]"; // Light purple for animation target
    }
    if (isDropTarget) {
      return "bg-[#d8c8a8]"; // Subtle warm highlight for drop target
    }
    if (isSelected) {
      return "bg-[#e0d4a8]"; // Subtle golden tint for selected
    }
    return isLight ? "bg-board-light" : "bg-board-dark";
  };

  return (
    <div
      onMouseDown={piece ? onMouseDown : undefined}
      onTouchStart={piece ? onTouchStart : undefined}
      className={`
        relative aspect-square
        ${getBgColor()}
        ${cornerClass}
        transition-colors duration-150
        ${piece ? "cursor-grab active:cursor-grabbing" : ""}
        ${isAnimationTarget ? "animation-target-pulse" : ""}
        touch-none select-none
      `}
    >
      {piece && <Piece piece={piece} />}
    </div>
  );
}
