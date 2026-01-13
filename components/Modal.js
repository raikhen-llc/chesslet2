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
  solutionCount,
  title = "Congratulations!",
  showNextButton = true,
  nextButtonText = "Next Puzzle →",
}) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-icon">🎉</div>
      <h2 className="modal-title">{title}</h2>
      <p className="modal-text">
        {solutionCount === 1
          ? "You found the only solution"
          : solutionCount > 1
          ? `You found one of ${solutionCount}${
              solutionCount >= 1000 ? "+" : ""
            } solutions`
          : `Solved in ${moveCount} ${moveCount === 1 ? "move" : "moves"}!`}
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
  solutionCount,
  levelNumber,
  isLastLevel = false,
}) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-icon">🎉</div>
      <h2 className="modal-title">Level {levelNumber} Complete!</h2>
      <p className="modal-text">
        {solutionCount === 1
          ? "You found the only solution"
          : solutionCount > 1
          ? `You found one of ${solutionCount}${
              solutionCount >= 1000 ? "+" : ""
            } solutions`
          : `Solved in ${moveCount} ${moveCount === 1 ? "move" : "moves"}!`}
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

/**
 * Instructions Modal - Explains game rules
 */
export function InstructionsModal({ onClose }) {
  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">How to Play</h2>
      <div className="instructions-content">
        <div className="instruction-item">
          <span className="step-number">1</span>
          <p>Capture your own pieces by jumping over them.</p>
        </div>
        <div className="instruction-item">
          <span className="step-number">2</span>
          <p>
            Every move <strong>must</strong> be a capture.
          </p>
        </div>
        <div className="instruction-item">
          <span className="step-number">3</span>
          <p>
            Win by leaving only <strong>one</strong> piece on the board.
          </p>
        </div>
      </div>
      <div className="modal-buttons">
        <button className="btn btn-primary" onClick={onClose}>
          Got it
        </button>
      </div>

      <style jsx>{`
        .modal-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--surface-800);
          text-align: center;
          margin-bottom: 2rem;
        }

        .instructions-content {
          text-align: left;
          margin-bottom: 2rem;
          color: var(--surface-600);
          font-size: 1rem;
          line-height: 1.5;
        }

        .instruction-item {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .instruction-item:last-child {
          margin-bottom: 0;
        }

        .step-number {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          background: #fde047;
          color: #854d0e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          margin-top: 0.1rem;
        }

        .instruction-item p {
          margin: 0;
        }

        .modal-buttons {
          display: flex;
          justify-content: center;
        }
      `}</style>
    </Modal>
  );
}
