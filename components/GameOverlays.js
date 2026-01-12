"use client";

/**
 * Win Celebration overlay - confetti animation
 */
export function WinCelebration() {
  const colors = ["#d4a012", "#22c55e", "#a855f7", "#f97316"];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full win-celebration"
          style={{
            left: `${Math.random() * 100}%`,
            top: "100%",
            backgroundColor: colors[i % 4],
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Impossible Overlay - shown when puzzle has no solution
 */
export function ImpossibleOverlay() {
  return (
    <div className="impossible-overlay">
      <div className="text-center text-white">
        <div className="text-5xl mb-3">⚠️</div>
        <div className="text-xl font-semibold">Impossible Puzzle</div>
        <div className="text-sm opacity-80 mt-1">
          This puzzle has no solution
        </div>
      </div>
    </div>
  );
}
