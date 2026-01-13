"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import ModeSelectModal, { getModeName } from "./ModeSelectModal";
import { InstructionsModal } from "./Modal";

/**
 * Reusable Header component
 * @param {Object} props
 * @param {"small" | "large"} props.size - Header size variant
 * @param {string} props.navLink - Optional navigation link URL
 * @param {string} props.navLabel - Optional navigation link label
 * @param {boolean} props.centered - Whether to center the logo (no nav)
 */
export default function Header({
  size = "small",
  navLink,
  navLabel,
  centered = false,
}) {
  const logoSize = size === "large" ? 48 : 40;
  const textClass = size === "large" ? "logo-text-large" : "logo-text-small";

  const logo = (
    <div className="header-logo">
      <img
        src="/pieces/wN.svg"
        alt="Chesslet icon"
        className="logo-icon"
        width={logoSize}
        height={logoSize}
      />
      <h1 className={textClass}>Chesslet</h1>
    </div>
  );

  return (
    <header className={`header ${centered ? "header-centered" : ""}`}>
      {navLink ? (
        <Link href={navLink} className="header-logo-link">
          {logo}
        </Link>
      ) : (
        logo
      )}

      {navLink && navLabel && !centered && (
        <button
          className="btn-link"
          onClick={() => (window.location.href = navLink)}
        >
          {navLabel}
        </button>
      )}
    </header>
  );
}

/**
 * Simple header with back navigation (legacy - kept for backwards compatibility)
 */
export function HeaderWithNav({ navHref, navLabel }) {
  return (
    <header className="header">
      <div className="header-left">
        <img
          src="/pieces/wN.svg"
          alt="Chesslet icon"
          className="logo-icon"
          width={40}
          height={40}
        />
        <h1 className="logo-text">Chesslet</h1>
      </div>
      <Link href={navHref} className="btn-link">
        {navLabel}
      </Link>
    </header>
  );
}

/**
 * Header with mode selector button
 * Opens a modal to switch between game modes
 */
export function HeaderWithModeSelect() {
  const [showModeModal, setShowModeModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const pathname = usePathname();
  const currentModeName = getModeName(pathname);

  return (
    <>
      <header className="header">
        <div className="header-left">
          <img
            src="/pieces/wN.svg"
            alt="Chesslet icon"
            className="logo-icon"
            width={40}
            height={40}
          />
          <h1 className="logo-text">Chesslet</h1>
        </div>
        <div className="header-right">
          <button
            className="help-btn"
            onClick={() => setShowInstructions(true)}
            aria-label="How to play"
          >
            <HelpIcon />
          </button>
          <button
            className="mode-selector-btn"
            onClick={() => setShowModeModal(true)}
          >
            <span className="mode-name">{currentModeName}</span>
            <ChevronDownIcon />
          </button>
        </div>
      </header>

      {showModeModal && (
        <ModeSelectModal onClose={() => setShowModeModal(false)} />
      )}

      {showInstructions && (
        <InstructionsModal onClose={() => setShowInstructions(false)} />
      )}
    </>
  );
}

function HelpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: 16, height: 16, color: "var(--surface-400)" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
