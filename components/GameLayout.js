"use client";

import Footer from "./Footer";

export default function GameLayout({ children }) {
  return (
    <div className="page-container">
      <div className="content-wrapper">
        {children}
        <Footer />
      </div>
    </div>
  );
}
