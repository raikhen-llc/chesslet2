"use client";

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
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Select Level</h2>
        <div className="level-grid">
          {levels.map((level) => {
            const isCompleted = completedLevels.has(level.level);
            const isCurrent = level.level === currentLevel;
            return (
              <button
                key={level.level}
                className={`level-cell ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                onClick={() => onSelectLevel(level.level)}
              >
                <span className="level-cell-number">{level.level}</span>
                {isCompleted && <span className="level-cell-check">✓</span>}
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

        .level-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 0.5rem;
          margin: 1.5rem 0;
        }

        .level-cell {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--surface-100);
          border: 2px solid var(--surface-200);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          position: relative;
        }

        .level-cell:hover {
          border-color: var(--accent-400);
          background: var(--accent-50);
        }

        .level-cell.completed {
          background: var(--accent-100);
          border-color: var(--accent-300);
        }

        .level-cell.current {
          border-color: var(--accent-500);
          box-shadow: 0 0 0 2px var(--accent-200);
        }

        .level-cell-number {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--surface-700);
        }

        .level-cell.completed .level-cell-number {
          color: var(--accent-700);
        }

        .level-cell-check {
          position: absolute;
          top: 2px;
          right: 3px;
          font-size: 0.625rem;
          color: var(--accent-600);
        }

        .modal-close-btn {
          margin-top: 0.5rem;
          width: 100%;
        }

        @media (max-width: 520px) {
          .level-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
