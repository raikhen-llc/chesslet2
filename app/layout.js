import './globals.css';

export const metadata = {
  title: 'Chesslet - Chess Capture Puzzle',
  description: 'A chess puzzle game where every move must be a capture',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
