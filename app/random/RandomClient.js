"use client";

import GamePage from "@/components/GamePage";

export default function RandomClient({ initialFen }) {
  return (
    <GamePage
      mode="random"
      initialFen={initialFen}
      selectedDifficulty={null}
    />
  );
}
