"use client";

import Link from "next/link";

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

      <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-centered {
          justify-content: center;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-icon {
          width: ${logoSize}px;
          height: ${logoSize}px;
        }

        .logo-text-small {
          font-size: 1.75rem;
          font-weight: 500;
          color: var(--surface-800);
          letter-spacing: -0.03em;
          margin: 0;
        }

        .logo-text-large {
          font-size: 2.5rem;
          font-weight: 500;
          color: var(--surface-800);
          letter-spacing: -0.03em;
          margin: 0;
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--accent-600);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: background-color 0.15s;
        }

        .btn-link:hover {
          background: var(--accent-50);
        }

        @media (max-width: 520px) {
          .logo-icon {
            width: ${logoSize === 48 ? 40 : 32}px;
            height: ${logoSize === 48 ? 40 : 32}px;
          }

          .logo-text-small {
            font-size: 1.5rem;
          }

          .logo-text-large {
            font-size: 2rem;
          }
        }
      `}</style>
    </header>
  );
}

/**
 * Simple header with back navigation
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

      <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
        }

        .logo-text {
          font-size: 1.75rem;
          font-weight: 500;
          color: var(--surface-800);
          letter-spacing: -0.03em;
          margin: 0;
        }

        @media (max-width: 520px) {
          .logo-icon {
            width: 32px;
            height: 32px;
          }

          .logo-text {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </header>
  );
}
