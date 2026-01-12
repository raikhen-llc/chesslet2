"use client";

import { PIECE_IMAGES } from "@/lib/constants";

/**
 * Piece component - A chess piece displayed on a square
 * Uses absolute positioning to avoid any layout shifts
 */
export default function Piece({ piece }) {
  if (!piece) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <img
        src={PIECE_IMAGES[piece]}
        alt={piece}
        width={68}
        height={68}
        className="w-[85%] h-[85%] object-contain pointer-events-none drop-shadow-lg"
        draggable={false}
      />
    </div>
  );
}
