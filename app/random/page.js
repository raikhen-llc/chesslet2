"use client";

import { useState, useCallback } from "react";
import GamePage from "@/components/GamePage";

/**
 * Random Mode page - Endless randomly generated puzzles
 */
export default function RandomPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [puzzleKey, setPuzzleKey] = useState(0);

  const handleDifficultyChange = useCallback((newDifficulty) => {
    setSelectedDifficulty(newDifficulty);
    // Force re-render to generate new puzzle
    setPuzzleKey((k) => k + 1);
  }, []);

  return (
    <div className="page-container">
      <GamePage
        key={puzzleKey}
        mode="random"
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={handleDifficultyChange}
      />

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 2rem 1.5rem;
          padding-top: 3rem;
        }

        @media (max-width: 520px) {
          .page-container {
            padding: 1.5rem 1rem;
            padding-top: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
