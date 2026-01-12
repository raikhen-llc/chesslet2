"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TOTAL_LEVELS } from "@/lib/levels";

/**
 * Home page - Landing page with game mode selection
 */
export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState({ level: 1, completedCount: 0 });

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem("chesslet-progress");
    if (savedProgress) {
      try {
        const { level, completed } = JSON.parse(savedProgress);
        setProgress({
          level: level || 1,
          completedCount: completed?.length || 0,
        });
      } catch (e) {
        console.error("Failed to load progress:", e);
      }
    }
  }, []);

  const progressPercent = (progress.completedCount / TOTAL_LEVELS) * 100;

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Header */}
        <header className="header">
          <img
            src="/pieces/wN.svg"
            alt="Chesslet icon"
            className="logo-icon"
            width={64}
            height={64}
          />
          <h1 className="logo-text">Chesslet</h1>
          <p className="tagline">Chess piece solitaire puzzle</p>
        </header>

        {/* Game Mode Cards */}
        <div className="mode-cards">
          {/* Campaign Mode */}
          <button
            className="mode-card mode-card-primary"
            onClick={() => router.push("/levels")}
          >
            <div className="mode-icon">🏆</div>
            <div className="mode-info">
              <h2 className="mode-title">Campaign Mode</h2>
              <p className="mode-description">
                100 levels of increasing difficulty
              </p>
              {/* Always render progress section with fixed height to prevent layout shift */}
              <div className="mode-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="progress-label">
                  {progress.completedCount > 0
                    ? `Level ${progress.level} • ${progress.completedCount} completed`
                    : "Start your journey →"}
                </span>
              </div>
            </div>
          </button>

          {/* Random Mode */}
          <button className="mode-card" onClick={() => router.push("/random")}>
            <div className="mode-icon">🎲</div>
            <div className="mode-info">
              <h2 className="mode-title">Random Mode</h2>
              <p className="mode-description">
                Endless randomly generated puzzles
              </p>
              <span className="mode-cta">Play now →</span>
            </div>
          </button>
        </div>

        {/* How to Play */}
        <div className="how-to-play">
          <h3 className="how-title">How to Play</h3>
          <div className="rules">
            <div className="rule">
              <span className="rule-number">1</span>
              <p>Every move must capture another piece</p>
            </div>
            <div className="rule">
              <span className="rule-number">2</span>
              <p>Pieces move like in regular chess</p>
            </div>
            <div className="rule">
              <span className="rule-number">3</span>
              <p>Win when only one piece remains</p>
            </div>
          </div>
        </div>
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
          align-items: center;
          gap: 2.5rem;
        }

        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-align: center;
        }

        .logo-icon {
          width: 64px;
          height: 64px;
          margin-bottom: 0.25rem;
        }

        .logo-text {
          font-size: 3rem;
          font-weight: 500;
          color: var(--surface-800);
          letter-spacing: -0.03em;
        }

        .tagline {
          font-size: 1.125rem;
          color: var(--surface-500);
          margin: 0;
        }

        .mode-cards {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mode-card {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          padding: 1.5rem;
          background: white;
          border: 2px solid var(--surface-200);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .mode-card:hover {
          border-color: var(--accent-300);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .mode-card-primary {
          background: linear-gradient(135deg, var(--accent-50), white);
          border-color: var(--accent-200);
        }

        .mode-card-primary:hover {
          border-color: var(--accent-400);
        }

        .mode-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .mode-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .mode-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--surface-800);
          margin: 0;
        }

        .mode-description {
          font-size: 0.9375rem;
          color: var(--surface-600);
          margin: 0;
          line-height: 1.4;
        }

        .mode-cta {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent-600);
          margin-top: 0.25rem;
        }

        .mode-progress {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          margin-top: 0.5rem;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: var(--surface-200);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--accent-400),
            var(--accent-500)
          );
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-label {
          font-size: 0.8125rem;
          color: var(--surface-500);
        }

        .how-to-play {
          width: 100%;
          background: white;
          border: 1px solid var(--surface-200);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .how-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--surface-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 1rem;
          text-align: center;
        }

        .rules {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .rule {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .rule-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-100);
          color: var(--accent-700);
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .rule p {
          margin: 0;
          font-size: 0.9375rem;
          color: var(--surface-700);
        }

        @media (max-width: 520px) {
          .page-container {
            padding: 1.5rem 1rem;
          }

          .logo-icon {
            width: 48px;
            height: 48px;
          }

          .logo-text {
            font-size: 2.25rem;
          }

          .tagline {
            font-size: 1rem;
          }

          .mode-card {
            padding: 1.25rem;
          }

          .mode-icon {
            font-size: 2rem;
          }

          .mode-title {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
}
