import { DM_Sans, Crimson_Pro } from "next/font/google";
import "./globals.css";

// Load fonts with next/font to prevent layout shift (FOUT/FOIT)
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-crimson-pro",
  display: "swap",
});

export const metadata = {
  title: "Chesslet - Chess Capture Puzzle",
  description: "A chess puzzle game where every move must be a capture",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${crimsonPro.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
