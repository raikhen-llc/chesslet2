"use client";

import Link from "next/link";
import GamePage from "@/components/GamePage";
import { urlToFen, isValidFen } from "@/lib/fen";

/**
 * Puzzle page - Loads a specific puzzle from the URL
 */
export default function PuzzlePage({ params }) {
  const urlFen = params.fen;
  const fen = urlToFen(decodeURIComponent(urlFen));
  const isValid = isValidFen(fen);

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
    <div className="page-container">
      <div className="content-wrapper">
        <GamePage mode="puzzle" initialFen={fen} />

        {/* Footer */}
        <footer className="footer">
          <span>
            Made by <strong>Dylan Fridman</strong>
          </span>
        </footer>
      </div>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
        }

        .content-wrapper {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .footer {
          text-align: center;
          color: var(--surface-500);
          font-size: 0.875rem;
          padding-top: 1rem;
        }

        .footer strong {
          font-weight: 600;
          color: var(--surface-600);
        }

        @media (max-width: 520px) {
          .page-container {
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
