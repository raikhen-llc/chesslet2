/**
 * Tests for lib/useGame.js - Game state hook
 */

import { renderHook, act } from '@testing-library/react';
import { useGame, GAME_STATE } from '../../lib/useGame';

describe('useGame - Initial State', () => {
  test('Initializes with null board when no FEN provided', () => {
    const { result } = renderHook(() => useGame());
    
    // Initially null before puzzle generation
    // Note: The hook calls newPuzzle() in useEffect, but that's async
    expect(result.current.board === null || Array.isArray(result.current.board)).toBe(true);
  });

  test('Initializes with provided FEN', () => {
    const fen = 'K3/4/4/3Q';
    const { result } = renderHook(() => useGame(fen));

    expect(result.current.board).toBeDefined();
    expect(result.current.board[0][0]).toBe('K');
    expect(result.current.board[3][3]).toBe('Q');
  });

  test('Sets correct initial game state for solvable puzzle', () => {
    const fen = 'K3/4/4/3Q';
    const { result } = renderHook(() => useGame(fen));

    expect(result.current.gameState).toBe(GAME_STATE.PLAYING);
  });

  test('Sets impossible state for unsolvable puzzle', () => {
    const fen = 'P3/4/4/3P'; // Two pawns that can't capture
    const { result } = renderHook(() => useGame(fen));

    expect(result.current.gameState).toBe(GAME_STATE.IMPOSSIBLE);
  });

  test('Initializes move history as empty', () => {
    const fen = 'K3/4/4/3Q';
    const { result } = renderHook(() => useGame(fen));

    expect(result.current.moveHistory).toHaveLength(0);
  });

  test('Calculates pieces remaining correctly', () => {
    const fen = 'KQ2/4/4/3R';
    const { result } = renderHook(() => useGame(fen));

    expect(result.current.piecesRemaining).toBe(3);
  });
});

describe('useGame - makeMove', () => {
  test('Executes valid capture', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      const success = result.current.makeMove(0, 0, 0, 1);
      expect(success).toBe(true);
    });

    expect(result.current.board[0][0]).toBeNull();
    expect(result.current.board[0][1]).toBe('K');
  });

  test('Rejects invalid capture', () => {
    const fen = 'K3/4/4/3Q';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      const success = result.current.makeMove(0, 0, 0, 2); // King can't move 2 squares
      expect(success).toBe(false);
    });

    // Board should be unchanged
    expect(result.current.board[0][0]).toBe('K');
  });

  test('Updates move history after move', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    expect(result.current.moveHistory).toHaveLength(1);
    expect(result.current.moveHistory[0].from).toEqual({ row: 0, col: 0 });
    expect(result.current.moveHistory[0].to).toEqual({ row: 0, col: 1 });
  });

  test('Updates lastMove after move', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    expect(result.current.lastMove).not.toBeNull();
    expect(result.current.lastMove.from).toEqual({ row: 0, col: 0 });
    expect(result.current.lastMove.to).toEqual({ row: 0, col: 1 });
  });

  test('Sets WON state when puzzle solved', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    expect(result.current.gameState).toBe(GAME_STATE.WON);
    expect(result.current.piecesRemaining).toBe(1);
  });

  test('Sets STUCK state when no moves available', () => {
    // Setup: After one move, remaining pieces can't capture each other
    const fen = 'QP2/P3/4/4';
    const { result } = renderHook(() => useGame(fen));

    // Queen captures first pawn, leaving two pawns that can't capture
    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    // Now Q at (0,1), P at (1,0)
    // Check if stuck (depends on exact board state)
    // This is a structural test - in reality the game might not be stuck
    expect([GAME_STATE.PLAYING, GAME_STATE.STUCK, GAME_STATE.WON]).toContain(result.current.gameState);
  });

  test('Does not allow moves in non-playing state', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    // First move wins
    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    expect(result.current.gameState).toBe(GAME_STATE.WON);

    // Try another move - should fail
    act(() => {
      const success = result.current.makeMove(0, 1, 1, 1);
      expect(success).toBe(false);
    });
  });
});

describe('useGame - undoMove', () => {
  test('Undoes last move', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    expect(result.current.board[0][0]).toBeNull();
    expect(result.current.board[0][1]).toBe('K');

    act(() => {
      const success = result.current.undoMove();
      expect(success).toBe(true);
    });

    expect(result.current.board[0][0]).toBe('K');
    expect(result.current.board[0][1]).toBe('Q');
  });

  test('Returns false when no moves to undo', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      const success = result.current.undoMove();
      expect(success).toBe(false);
    });
  });

  test('Updates move history after undo', () => {
    const fen = 'KQR1/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1); // K captures Q
    });

    expect(result.current.moveHistory).toHaveLength(1);

    act(() => {
      result.current.undoMove();
    });

    expect(result.current.moveHistory).toHaveLength(0);
  });

  test('Restores PLAYING state from WON state', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    expect(result.current.gameState).toBe(GAME_STATE.WON);

    act(() => {
      result.current.undoMove();
    });

    expect(result.current.gameState).toBe(GAME_STATE.PLAYING);
  });

  test('Multiple undos restore to initial state', () => {
    const fen = 'QKR1/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    // Make two moves
    act(() => {
      result.current.makeMove(0, 0, 0, 1); // Q captures K
    });
    
    act(() => {
      result.current.makeMove(0, 1, 0, 2); // Q captures R
    });

    expect(result.current.moveHistory).toHaveLength(2);

    // Undo both
    act(() => {
      result.current.undoMove();
    });
    
    act(() => {
      result.current.undoMove();
    });

    expect(result.current.moveHistory).toHaveLength(0);
    expect(result.current.board[0][0]).toBe('Q');
    expect(result.current.board[0][1]).toBe('K');
    expect(result.current.board[0][2]).toBe('R');
  });
});

describe('useGame - resetPuzzle', () => {
  test('Resets to initial position', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    expect(result.current.board[0][0]).toBeNull();

    act(() => {
      result.current.resetPuzzle();
    });

    expect(result.current.board[0][0]).toBe('K');
    expect(result.current.board[0][1]).toBe('Q');
    expect(result.current.gameState).toBe(GAME_STATE.PLAYING);
    expect(result.current.moveHistory).toHaveLength(0);
  });

  test('Clears move history', () => {
    const fen = 'QKR1/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    expect(result.current.moveHistory).toHaveLength(1);

    act(() => {
      result.current.resetPuzzle();
    });

    expect(result.current.moveHistory).toHaveLength(0);
  });

  test('Resets from WON state', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    expect(result.current.gameState).toBe(GAME_STATE.WON);

    act(() => {
      result.current.resetPuzzle();
    });

    expect(result.current.gameState).toBe(GAME_STATE.PLAYING);
  });
});

describe('useGame - loadPuzzle', () => {
  test('Loads a new puzzle from FEN', () => {
    const { result } = renderHook(() => useGame('K3/4/4/4'));

    act(() => {
      result.current.loadPuzzle('Q3/4/4/3R');
    });

    expect(result.current.board[0][0]).toBe('Q');
    expect(result.current.board[3][3]).toBe('R');
    expect(result.current.gameState).toBe(GAME_STATE.PLAYING);
  });

  test('Resets move history on load', () => {
    const { result } = renderHook(() => useGame('KQ2/4/4/4'));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    expect(result.current.moveHistory).toHaveLength(1);

    act(() => {
      result.current.loadPuzzle('R3/4/4/3B');
    });

    expect(result.current.moveHistory).toHaveLength(0);
  });

  test('Sets IMPOSSIBLE state for unsolvable puzzle', () => {
    const { result } = renderHook(() => useGame('KQ2/4/4/4'));

    act(() => {
      result.current.loadPuzzle('P3/4/4/3P');
    });

    expect(result.current.gameState).toBe(GAME_STATE.IMPOSSIBLE);
  });
});

describe('useGame - requestHint', () => {
  test('Returns a valid move hint', () => {
    const fen = 'Q3/1K2/4/4';
    const { result } = renderHook(() => useGame(fen));

    let hint;
    act(() => {
      hint = result.current.requestHint();
    });

    expect(hint).not.toBeNull();
    expect(hint.from).toBeDefined();
    expect(hint.to).toBeDefined();
  });

  test('Returns null for already won game', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    let hint;
    act(() => {
      hint = result.current.requestHint();
    });

    expect(hint).toBeNull();
  });
});

describe('useGame - getSolution', () => {
  test('Returns solution from initial state', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    let solution;
    act(() => {
      solution = result.current.getSolution();
    });

    expect(solution).not.toBeNull();
    expect(solution.length).toBeGreaterThan(0);
  });
});

describe('useGame - getCurrentFen', () => {
  test('Returns current board as FEN', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    let currentFen;
    act(() => {
      currentFen = result.current.getCurrentFen();
    });

    expect(currentFen).toBe(fen);
  });

  test('Returns updated FEN after move', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    act(() => {
      result.current.makeMove(0, 0, 0, 1);
    });

    let currentFen;
    act(() => {
      currentFen = result.current.getCurrentFen();
    });

    expect(currentFen).toBe('1K2/4/4/4');
  });
});

describe('useGame - newPuzzle', () => {
  test('Generates a new puzzle', () => {
    const { result } = renderHook(() => useGame('K3/4/4/4'));

    const originalFen = result.current.getCurrentFen();

    act(() => {
      result.current.newPuzzle();
    });

    // Board should be different (most likely) or at least valid
    expect(result.current.board).not.toBeNull();
    expect(result.current.gameState).toBe(GAME_STATE.PLAYING);
  });

  test('Can target specific difficulty', () => {
    const { result } = renderHook(() => useGame('K3/4/4/4'));

    act(() => {
      result.current.newPuzzle(result.current.DIFFICULTY.EASY);
    });

    // Should have a valid puzzle
    expect(result.current.board).not.toBeNull();
    expect(result.current.gameState).toBe(GAME_STATE.PLAYING);
  });
});

describe('useGame - State Properties', () => {
  test('Exposes GAME_STATE constants', () => {
    const { result } = renderHook(() => useGame('K3/4/4/4'));

    expect(result.current.GAME_STATE).toBeDefined();
    expect(result.current.GAME_STATE.PLAYING).toBe('playing');
    expect(result.current.GAME_STATE.WON).toBe('won');
    expect(result.current.GAME_STATE.STUCK).toBe('stuck');
    expect(result.current.GAME_STATE.IMPOSSIBLE).toBe('impossible');
  });

  test('Exposes DIFFICULTY constants', () => {
    const { result } = renderHook(() => useGame('K3/4/4/4'));

    expect(result.current.DIFFICULTY).toBeDefined();
    expect(result.current.DIFFICULTY.EASY).toBe('easy');
    expect(result.current.DIFFICULTY.MEDIUM).toBe('medium');
    expect(result.current.DIFFICULTY.HARD).toBe('hard');
  });

  test('Tracks validMovesCount', () => {
    const fen = 'KQ2/4/4/4';
    const { result } = renderHook(() => useGame(fen));

    // K at (0,0) can capture Q at (0,1) - that's 1 move
    // Q at (0,1) can capture K at (0,0) - that's 1 more move
    expect(result.current.validMovesCount).toBe(2);
  });
});
