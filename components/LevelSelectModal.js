"use client";

// Maps difficulty to color classes
const DIFFICULTY_COLORS = {
  "very-easy": { bg: "#dcfce7", border: "#86efac", dot: "#22c55e" },
  "easy": { bg: "#ccfbf1", border: "#5eead4", dot: "#14b8a6" },
  "medium": { bg: "#fef3c7", border: "#fcd34d", dot: "#f59e0b" },
  "hard": { bg: "#fee2e2", border: "#fca5a5", dot: "#ef4444" },
  "very-hard": { bg: "#ede9fe", border: "#c4b5fd", dot: "#7c3aed" },
};

/**
 * Level Select Modal - Grid for selecting levels in campaign mode
 */
export default function LevelSelectModal({
  levels,
  currentLevel,
  completedLevels,
  onSelectLevel,
  onClose,
}) {
  return (
    <div className="modal" onClick={onClose}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Select Level</h2>
        
        {/* Difficulty Legend */}
        <div className="difficulty-legend">
          {Object.entries(DIFFICULTY_COLORS).map(([key, colors]) => (
            <div key={key} className="legend-item">
              <span 
                className="legend-dot" 
                style={{ background: colors.dot }}
              />
              <span className="legend-label">{key.replace(/-/g, " ")}</span>
            </div>
          ))}
        </div>
        
        <div className="level-grid">
          {levels.map((level) => {
            const isCompleted = completedLevels.has(level.level);
            const isCurrent = level.level === currentLevel;
            const colors = DIFFICULTY_COLORS[level.difficulty] || DIFFICULTY_COLORS.easy;
            return (
              <button
                key={level.level}
                className={`level-cell ${isCompleted ? "completed" : ""} ${
                  isCurrent ? "current" : ""
                }`}
                style={{
                  "--cell-bg": colors.bg,
                  "--cell-border": colors.border,
                  "--cell-dot": colors.dot,
                }}
                onClick={() => onSelectLevel(level.level)}
                title={level.difficulty?.replace(/-/g, " ")}
              >
                <span className="level-cell-number">{level.level}</span>
              </button>
            );
          })}
        </div>
        <button className="btn modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>

      <style jsx>{`
        .modal-large {
          max-width: 560px;
          width: 90vw;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-title {
          font-size: 1.75rem;
          font-weight: 500;
          color: var(--surface-800);
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .difficulty-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem 1.25rem;
          margin: 0.75rem 0 1rem;
          padding: 0.75rem;
          background: var(--surface-50);
          border-radius: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-label {
          font-size: 0.6875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--surface-600);
        }

        .level-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 0.5rem;
          margin: 1rem 0 1.5rem;
        }

        .level-cell {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--cell-bg, var(--surface-100));
          border: 2px solid var(--cell-border, var(--surface-200));
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          position: relative;
        }

        .level-cell:hover {
          transform: scale(1.08);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }

        .level-cell.completed {
          opacity: 0.75;
        }

        .level-cell.completed::after {
          content: "✓";
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 0.5rem;
          color: white;
          font-weight: 700;
          background: var(--cell-dot, var(--accent-600));
          width: 14px;
          height: 14px;
          border-radius: 50%;
          line-height: 14px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .level-cell.current {
          box-shadow: 0 0 0 2px var(--cell-dot, var(--accent-500));
        }

        .level-cell-number {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--surface-700);
        }

        .modal-close-btn {
          margin-top: 0.5rem;
          width: 100%;
        }

        @media (max-width: 520px) {
          .level-grid {
            grid-template-columns: repeat(5, 1fr);
          }
          
          .difficulty-legend {
            gap: 0.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
