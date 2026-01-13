"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GamePage from "@/components/GamePage";
import GameLayout from "@/components/GameLayout";
import { urlToFen, isValidFen } from "@/lib/fen";

/**
 * Puzzle page - Loads a specific puzzle from the URL
 */
export default function PuzzlePage({ params }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const urlFen = params.fen;
  const fen = urlToFen(decodeURIComponent(urlFen));
  const isValid = isValidFen(fen);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isValid) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">♞</div>
          <h1 className="text-3xl font-medium text-surface-800 mb-4">
            Invalid Puzzle
          </h1>
          <p className="text-surface-500 mb-8 text-lg">
            The puzzle code "{urlFen}" could not be found.
          </p>
          <Link href="/" className="btn btn-primary">
            Go to Random Puzzle
          </Link>
        </div>
      </main>
    );
  }

  return (
    <GameLayout>
      <GamePage mode="puzzle" initialFen={fen} />
    </GameLayout>
  );
}
