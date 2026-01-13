import { generatePuzzle } from "@/lib/generator";
import GameLayout from "@/components/GameLayout";
import RandomClient from "./RandomClient";

/**
 * Random Mode page - Endless randomly generated puzzles
 * Server Component
 */
export default function RandomPage() {
  // Generate initial puzzle on the server
  const puzzle = generatePuzzle({ difficulty: null });

  return (
    <GameLayout>
      <RandomClient initialFen={puzzle?.fen} />
    </GameLayout>
  );
}
