"use client";

import { useRouter, usePathname } from "next/navigation";

/**
 * Mode configuration for all game modes
 */
const MODES = [
  {
    id: "campaign",
    name: "Campaign",
    description: "100 levels of increasing difficulty",
    icon: "🏆",
    path: "/",
  },
  {
    id: "random",
    name: "Random",
    description: "Endless randomly generated puzzles",
    icon: "🎲",
    path: "/random",
  },
  {
    id: "timed",
    name: "Timed",
    description: "Solve as many puzzles as you can in 60 seconds",
    icon: "⏱️",
    path: "/timed",
  },
  {
    id: "designer",
    name: "Designer",
    description: "Create and share your own puzzles",
    icon: "🎨",
    path: "/designer",
  },
];

/**
 * Get current mode ID based on pathname
 */
export function getCurrentMode(pathname) {
  if (pathname === "/") return "campaign";
  if (pathname === "/random") return "random";
  if (pathname === "/timed") return "timed";
  if (pathname === "/designer") return "designer";
  if (pathname.startsWith("/puzzle/")) return "puzzle";
  return "campaign";
}

/**
 * Get mode display name
 */
export function getModeName(pathname) {
  const modeId = getCurrentMode(pathname);
  const mode = MODES.find((m) => m.id === modeId);
  return mode?.name || "Campaign";
}

/**
 * Mode Selection Modal - allows switching between game modes
 */
export default function ModeSelectModal({ onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentModeId = getCurrentMode(pathname);

  const handleSelectMode = (mode) => {
    if (mode.path !== pathname) {
      router.push(mode.path);
    }
    onClose();
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Select Mode</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="modes-grid">
          {MODES.map((mode) => {
            const isActive = mode.id === currentModeId;
            return (
              <button
                key={mode.id}
                className={`mode-card ${isActive ? "mode-card-active" : ""}`}
                onClick={() => handleSelectMode(mode)}
              >
                <span className="mode-icon">{mode.icon}</span>
                <div className="mode-info">
                  <span className="mode-name">{mode.name}</span>
                  <span className="mode-description">{mode.description}</span>
                </div>
                {isActive && (
                  <span className="active-badge">
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .modal-content {
          max-width: 440px;
          padding: 1.5rem;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--surface-800);
          margin: 0;
        }

        .close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: var(--surface-500);
          transition: all 0.15s;
        }

        .close-btn:hover {
          background: var(--surface-100);
          color: var(--surface-700);
        }

        .modes-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .mode-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: white;
          border: 2px solid var(--surface-200);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          position: relative;
        }

        .mode-card:hover {
          border-color: var(--accent-300);
          background: var(--accent-50);
        }

        .mode-card-active {
          border-color: var(--accent-400);
          background: linear-gradient(
            135deg,
            var(--accent-50),
            var(--accent-100)
          );
        }

        .mode-card-active:hover {
          border-color: var(--accent-500);
        }

        .mode-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .mode-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }

        .mode-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--surface-800);
        }

        .mode-description {
          font-size: 0.875rem;
          color: var(--surface-500);
          line-height: 1.4;
        }

        .active-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--accent-500);
          border-radius: 50%;
          flex-shrink: 0;
        }

        @media (max-width: 520px) {
          .modal-content {
            padding: 1.25rem;
          }

          .mode-card {
            padding: 0.875rem 1rem;
          }

          .mode-icon {
            font-size: 1.75rem;
          }

          .mode-name {
            font-size: 1rem;
          }

          .mode-description {
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 20, height: 20 }}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="3"
      style={{ width: 14, height: 14 }}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
