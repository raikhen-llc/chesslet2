# ♟️ Chesslet

A minimalist chess puzzle game with a twist: **every move must be a capture**. Reduce the board to a single piece to win.

## 🎯 The Rules

1. **4×4 Board** — A compact battlefield with white pieces only
2. **Capture Only** — You can only move by capturing another piece
3. **One Piece Wins** — Keep capturing until only one piece remains

## ✨ Features

- **100 Campaign Levels** — Progress through puzzles ranging from Very Easy to Very Hard
- **Random Mode** — Generate endless puzzles at your chosen difficulty
- **Shareable Puzzles** — Share any puzzle via URL with custom FEN encoding
- **Puzzle Designer** — Create your own challenges
- **Solution Viewer** — Watch animated solutions when you're stuck
- **Progress Tracking** — Your campaign progress is saved locally

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chesslet.git
cd chesslet

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

### Build for Production

```bash
npm run build
npm start
```

## 🎮 Game Modes

| Mode | Route | Description |
|------|-------|-------------|
| **Campaign** | `/` | 100 curated levels with progressive difficulty |
| **Random** | `/random` | Generate puzzles with difficulty selection |
| **Puzzle** | `/puzzle/[fen]` | Play a specific puzzle via URL |
| **Designer** | `/designer` | Create custom puzzles |
| **Timed** | `/timed` | Race against the clock *(coming soon)* |

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + styled-jsx
- **Testing:** Jest + React Testing Library
- **Fonts:** DM Sans, Crimson Pro

## 📁 Project Structure

```
├── app/                    # Next.js app router pages
│   ├── page.js            # Campaign mode (home)
│   ├── random/            # Random puzzle mode
│   ├── puzzle/[fen]/      # Shareable puzzles
│   ├── designer/          # Puzzle designer
│   └── timed/             # Timed mode
├── components/            # React components
│   ├── Board.js           # Chess board with drag & drop
│   ├── GamePage.js        # Unified game page component
│   └── ...
├── lib/                   # Game logic
│   ├── engine.js          # Move validation & captures
│   ├── solver.js          # DFS puzzle solver
│   ├── generator.js       # Random puzzle generation
│   ├── fen.js             # 4x4 FEN encoding/decoding
│   ├── useGame.js         # React game state hook
│   └── levels.js          # Pre-generated campaign levels
├── scripts/               # Build scripts
│   └── generate-levels.js # Regenerate campaign levels
└── __tests__/             # Test suites
```

## 📜 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm start            # Run production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Lint the codebase
```

### Level Generation

```bash
node scripts/generate-levels.js  # Regenerate all 100 campaign levels
```

## 🧩 Custom FEN Format

Chesslet uses a custom 4×4 FEN notation:

```
KN2/4/4/PP2
│ │ │   │
│ │ │   └─ Row 4: two pawns, two empty
│ │ └───── Rows 2-3: empty
│ └─────── Row 1: Knight + 2 empty
└───────── Row 1: King
```

- **Pieces:** K (King), Q (Queen), R (Rook), B (Bishop), N (Knight), P (Pawn)
- **Empty squares:** Numbers 1-4
- **Rows:** Separated by `/`

## 🎨 UI Design

Chesslet features a warm, elegant aesthetic:
- Classic chess board colors (`#f0d9b5` / `#b58863`)
- Warm gold accent palette
- Subtle gradient backgrounds
- Smooth animations and micro-interactions

## 📄 License

MIT

---

**Made with ♟️ and ☕**
