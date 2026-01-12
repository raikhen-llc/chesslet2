"use client";

/**
 * Base Modal component
 */
export function Modal({ children, onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/**
 * Congratulations Modal - shown when puzzle is solved
 */
export function CongratsModal({
  onClose,
  onNextPuzzle,
  moveCount,
  title = "Congratulations!",
  showNextButton = true,
  nextButtonText = "Next Puzzle →",
}) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-icon">🎉</div>
      <h2 className="modal-title">{title}</h2>
      <p className="modal-text">
        Solved in {moveCount} {moveCount === 1 ? "move" : "moves"}!
      </p>
      <div className="modal-buttons">
        <button className="btn" onClick={onClose}>
          {showNextButton ? "Close" : "Stay"}
        </button>
        {showNextButton && (
          <button className="btn btn-primary" onClick={onNextPuzzle}>
            {nextButtonText}
          </button>
        )}
      </div>

      <style jsx>{`
        .modal-icon {
          font-size: 3.5rem;
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .modal-title {
          font-size: 1.75rem;
          font-weight: 500;
          color: var(--surface-800);
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .modal-text {
          font-size: 1rem;
          color: var(--surface-600);
          text-align: center;
          margin-bottom: 1.75rem;
        }

        .modal-buttons {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }
      `}</style>
    </Modal>
  );
}

/**
 * Level Complete Modal - for campaign mode
 */
export function LevelCompleteModal({
  onClose,
  onNextLevel,
  moveCount,
  levelNumber,
  isLastLevel = false,
}) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-icon">🎉</div>
      <h2 className="modal-title">Level {levelNumber} Complete!</h2>
      <p className="modal-text">
        Solved in {moveCount} {moveCount === 1 ? "move" : "moves"}!
      </p>
      <div className="modal-buttons">
        {isLastLevel ? (
          <button className="btn btn-primary" onClick={onClose}>
            🏆 All Levels Complete!
          </button>
        ) : (
          <>
            <button className="btn" onClick={onClose}>
              Stay
            </button>
            <button className="btn btn-primary" onClick={onNextLevel}>
              Next Level →
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .modal-icon {
          font-size: 3.5rem;
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .modal-title {
          font-size: 1.75rem;
          font-weight: 500;
          color: var(--surface-800);
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .modal-text {
          font-size: 1rem;
          color: var(--surface-600);
          text-align: center;
          margin-bottom: 1.75rem;
        }

        .modal-buttons {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }
      `}</style>
    </Modal>
  );
}
