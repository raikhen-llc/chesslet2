"use client";

import { useState, useEffect, useCallback } from "react";
import GamePage from "@/components/GamePage";
import GameLayout from "@/components/GameLayout";
import { getLevel, TOTAL_LEVELS } from "@/lib/levels";

/**
 * Home page - Campaign Mode (100 levels of increasing difficulty)
 */
export default function Home() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem("chesslet-progress");
    if (savedProgress) {
      try {
        const { level, completed } = JSON.parse(savedProgress);
        setCurrentLevel(level || 1);
        setCompletedLevels(new Set(completed || []));
      } catch (e) {
        console.error("Failed to load progress:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        "chesslet-progress",
        JSON.stringify({
          level: currentLevel,
          completed: Array.from(completedLevels),
        })
      );
    }
  }, [currentLevel, completedLevels, isLoaded]);

  // Go to next level
  const handleNextLevel = useCallback(() => {
    if (currentLevel < TOTAL_LEVELS) {
      setCurrentLevel((prev) => prev + 1);
    }
  }, [currentLevel]);

  // Handle level completion
  const handleLevelComplete = useCallback((level) => {
    setCompletedLevels((prev) => new Set([...prev, level]));
  }, []);

  // Jump to a specific level
  const handleSelectLevel = useCallback((level) => {
    setCurrentLevel(level);
  }, []);

  return (
    <GameLayout>
      <GamePage
        key={isLoaded ? currentLevel : "loading"}
        mode="levels"
        currentLevel={currentLevel}
        levelData={isLoaded ? getLevel(currentLevel) : null}
        completedLevels={completedLevels}
        onNextLevel={handleNextLevel}
        onLevelComplete={handleLevelComplete}
        onSelectLevel={handleSelectLevel}
        totalLevels={TOTAL_LEVELS}
        isLastLevel={currentLevel >= TOTAL_LEVELS}
      />
    </GameLayout>
  );
}
