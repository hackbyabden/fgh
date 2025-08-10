'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type Dispatch,
  type SetStateAction
} from 'react';
import {
  INITIAL_BOARD,
  type Board,
  type Square,
  type Piece,
  PIECE_VALUES,
} from '@/lib/constants';
import { translations } from '@/lib/localization';
import { getRoast } from '@/app/actions';
import { getPossibleMoves, isKingInCheck as isKingInCheckLogic, doesMoveExposeKing } from '@/lib/chess-logic';

export type GameMode = 'pvp' | 'pve';
export type Intensity = 'low' | 'medium' | 'high';
export type Language = 'English' | 'Urdu';
export type BotDifficulty = 'noob' | 'medium' | 'hard' | 'extreme';


export type GameSettings = {
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
  intensity: Intensity;
  language: Language;
};

type GameState = {
  board: Board;
  turn: 'white' | 'black';
  selectedPiece: (Square & Piece) | null;
  lastMove: { from: Square; to: Square } | null;
  roasts: { white: string[]; black: string[] };
  isGeneratingRoast: boolean;
  gameOver: { winner: 'white' | 'black' | 'draw' } | null;
  settings: GameSettings;
  setSettings: Dispatch<SetStateAction<GameSettings>>;
  t: (typeof translations)['en'];
  hints: { white: number; black: number };
  hint: { from: Square; to: Square } | null;
  isRoastDismissed: { white: boolean; black: boolean };
  handleSquareClick: (row: number, col: number) => void;
  resetGame: () => void;
  getValidMoves: (row: number, col: number) => Square[];
  isKingInCheck: (color: 'white' | 'black') => Square | null;
  getHint: () => void;
  dismissRoast: (player: 'white' | 'black') => void;
};

const GameContext = createContext<GameState | undefined>(undefined);

const cloneBoard = (board: Board): Board =>
  board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));

function getMoveNotation(
  from: Square,
  to: Square,
  piece: Piece,
  captured: boolean
): string {
  const files = 'abcdefgh';
  const ranks = '87654321';
  const pieceNotation =
    piece.type === 'pawn' ? '' : piece.type.charAt(0).toUpperCase();
  return `${pieceNotation}${files[from.col]}${ranks[from.row]}${
    captured ? 'x' : '-'
  }${files[to.col]}${ranks[to.row]}`;
}

export function GameProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: GameSettings;
}) {
  const [board, setBoard] = useState<Board>(() => cloneBoard(INITIAL_BOARD));
  const [turn, setTurn] = useState<'white' | 'black'>('white');
  const [selectedPiece, setSelectedPiece] = useState<(Square & Piece) | null>(
    null
  );
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null
  );
  
  const [isGeneratingRoast, setIsGeneratingRoast] = useState(false);
  const [gameOver, setGameOver] = useState<{
    winner: 'white' | 'black' | 'draw';
  } | null>(null);

  const [settings, setSettings] = useState<GameSettings>(initialSettings);
  const t = translations[settings.language === 'Urdu' ? 'ur' : 'en'];
  
  const [roasts, setRoasts] = useState<{ white: string[]; black: string[] }>({
      white: [t.initialRoast],
      black: [t.botRoast],
  });
  const [hints, setHints] = useState({ white: 3, black: 3 });
  const [hint, setHint] = useState<{ from: Square; to: Square } | null>(null);
  const [isRoastDismissed, setIsRoastDismissed] = useState({ white: false, black: false });


  useEffect(() => {
    // Keep roasts as they are, don't reset on language change during game
  }, [t.initialRoast]);

  const resetGame = useCallback(() => {
    // This will force a re-render of the parent, effectively restarting the game flow.
    window.location.reload();
  }, []);

  const isKingInCheck = useCallback((color: 'white' | 'black') => {
      return isKingInCheckLogic(color, board);
  }, [board]);

  const getValidMoves = useCallback(
    (row: number, col: number): Square[] => {
      const piece = board[row][col];
      if (!piece) return [];
      
      const allMoves = getPossibleMoves(piece, { row, col }, board, lastMove);
      return allMoves;
    },
    [board, lastMove]
  );
  
  const checkForGameOver = useCallback((currentBoard: Board, nextTurn: 'white' | 'black') => {
      let hasValidMoves = false;
      for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
              const piece = currentBoard[r][c];
              if (piece && piece.color === nextTurn) {
                  // Important: getValidMoves already filters moves that expose the king
                  const moves = getPossibleMoves(piece, { row: r, col: c }, currentBoard, lastMove);
                  if (moves.length > 0) {
                      hasValidMoves = true;
                      break;
                  }
              }
          }
          if (hasValidMoves) break;
      }

      if (!hasValidMoves) {
          const kingInCheckPos = isKingInCheckLogic(nextTurn, currentBoard);
          if (kingInCheckPos) {
              setGameOver({ winner: turn }); // Checkmate
          } else {
              setGameOver({ winner: 'draw' }); // Stalemate
          }
          return true;
      }
      return false;
  }, [turn, lastMove]);

  const dismissRoast = (player: 'white' | 'black') => {
    setIsRoastDismissed(prev => ({
        ...prev,
        [player]: true,
    }));
  };

  const movePiece = useCallback(
    async (from: Square, to: Square) => {
      if (gameOver) return;
      const pieceToMove = board[from.row][from.col];
      if (!pieceToMove) return;

      const validMoves = getValidMoves(from.row, from.col);
      const isValid = validMoves.some(m => m.row === to.row && m.col === to.col);

      if (!isValid) {
        setSelectedPiece(null);
        return;
      }

      const newBoard = cloneBoard(board);
      const capturedPiece = newBoard[to.row][to.col];
      newBoard[to.row][to.col] = pieceToMove;
      newBoard[from.row][from.col] = null;

      if (pieceToMove.type === 'pawn' && (to.row === 0 || to.row === 7)) {
        newBoard[to.row][to.col] = { ...pieceToMove, type: 'queen' };
      }

      const prevTurn = turn;
      const nextTurn = turn === 'white' ? 'black' : 'white';
      
      setBoard(newBoard);
      setLastMove({ from, to });
      setSelectedPiece(null);
      setHint(null);
      
      // Undismiss for next turn
      setIsRoastDismissed({ white: false, black: false });
      
      if (settings.gameMode === 'pve' && nextTurn === 'black') {
          // It's the bot's turn, so we show the "thinking" message.
          setRoasts(prev => ({...prev, black: [t.botRoast]}));
      }
      
      setTurn(nextTurn);
      
      const isOver = checkForGameOver(newBoard, nextTurn);
      if (isOver) {
        setIsGeneratingRoast(false);
        return;
      }

      setIsGeneratingRoast(true);
      
      const moveNotation = getMoveNotation(
        from,
        to,
        pieceToMove,
        !!capturedPiece
      );

      try {
        const generatedRoast = await getRoast({
          move: moveNotation,
          intensity: settings.intensity,
          language: settings.language,
        });
        setRoasts(prev => ({
          ...prev,
          [prevTurn]: [generatedRoast, ...prev[prevTurn].filter(r => ![t.initialRoast, t.botRoast].includes(r))],
        }));
      } catch (error) {
        const errorRoast = 'My circuits are fried. That move was... something else.';
        setRoasts(prev => ({
            ...prev,
            [prevTurn]: [errorRoast, ...prev[prevTurn].filter(r => ![t.initialRoast, t.botRoast].includes(r))],
        }));
      } finally {
        setIsGeneratingRoast(false);
      }
    },
    [board, turn, gameOver, settings, getValidMoves, checkForGameOver, t.initialRoast, t.botRoast]
  );
  
  const evaluateBoard = (currentBoard: Board, player: 'white' | 'black'): number => {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c];
        if (piece) {
          const value = PIECE_VALUES[piece.type];
          if (piece.color === player) {
            score += value;
          } else {
            score -= value;
          }
        }
      }
    }
    return score;
  };
  
  const getBestMove = (possibleMoves: { from: Square; to: Square; piece: Piece }[], difficulty: BotDifficulty, currentBoard: Board): { from: Square; to: Square } => {
      if (possibleMoves.length === 0) {
        // This should not happen if the game is not over
        throw new Error("Bot has no moves, but game is not over.");
      }

      const evaluateMove = (move: { from: Square; to: Square }): number => {
          const testBoard = cloneBoard(currentBoard);
          const piece = testBoard[move.from.row][move.from.col];
          if (!piece) return -Infinity;

          testBoard[move.to.row][move.to.col] = piece;
          testBoard[move.from.row][move.from.col] = null;
          
          return evaluateBoard(testBoard, 'black');
      };

      if (difficulty === 'noob') {
          return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      }

      let bestMoves = possibleMoves.map(move => ({
          move,
          score: (board[move.to.row][move.to.col] ? PIECE_VALUES[board[move.to.row][move.to.col]!.type] : 0),
          eval: difficulty === 'extreme' ? evaluateMove(move) : 0,
      }));

      if (difficulty === 'medium') {
          // Prioritize any capture
          const captureMoves = bestMoves.filter(m => m.score > 0);
          if (captureMoves.length > 0) {
              return captureMoves[Math.floor(Math.random() * captureMoves.length)].move;
          }
      }

      if (difficulty === 'hard' || difficulty === 'extreme') {
          // Hard: prioritize best capture. Extreme: use board evaluation
          const maxScore = Math.max(...bestMoves.map(m => difficulty === 'extreme' ? m.eval : m.score));
          const topMoves = bestMoves.filter(m => (difficulty === 'extreme' ? m.eval : m.score) === maxScore);
          return topMoves[Math.floor(Math.random() * topMoves.length)].move;
      }
      
      // Fallback to random for noob or if no other logic applies
      return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  };


  const handleBotMove = useCallback(async () => {
    if (gameOver) return;
    
    await new Promise(resolve => setTimeout(resolve, 500)); 

    const possibleMoves: { from: Square; to: Square, piece: Piece }[] = [];
    board.forEach((row, r) => {
      row.forEach((piece, c) => {
        if (piece && piece.color === 'black') {
          const moves = getValidMoves(r, c);
          moves.forEach((move) => {
            possibleMoves.push({ from: { row: r, col: c }, to: move, piece });
          });
        }
      });
    });

    if (possibleMoves.length > 0) {
      const bestMove = getBestMove(possibleMoves, settings.botDifficulty, board);
      // Short delay before the bot makes a move to feel more natural
      setTimeout(() => movePiece(bestMove.from, bestMove.to), 1000);
    } 
  }, [board, gameOver, movePiece, getValidMoves, settings.botDifficulty]);

  useEffect(() => {
    if (turn === 'black' && settings.gameMode === 'pve' && !gameOver) {
      handleBotMove();
    }
  }, [turn, settings.gameMode, gameOver, handleBotMove]);

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (gameOver) return;
      if (settings.gameMode === 'pve' && turn === 'black') return;

      const piece = board[row][col];

      if (selectedPiece) {
        const validMoves = getValidMoves(selectedPiece.row, selectedPiece.col);
        const isMoveValid = validMoves.some(m => m.row === row && m.col === col);
        
        if (isMoveValid) {
          movePiece(
            { row: selectedPiece.row, col: selectedPiece.col },
            { row, col }
          );
        } else {
          if (piece && piece.color === turn) {
            setSelectedPiece({ ...piece, row, col });
          } else {
            setSelectedPiece(null);
          }
        }
      } else if (piece && piece.color === turn) {
        setSelectedPiece({ ...piece, row, col });
      }
    },
    [board, selectedPiece, turn, gameOver, movePiece, settings.gameMode, getValidMoves]
  );

  const getHint = useCallback(() => {
    if (gameOver || hints[turn] <= 0) return;

    const allPossibleMoves: { from: Square; to: Square; piece: Piece }[] = [];
    board.forEach((row, r) => {
        row.forEach((piece, c) => {
            if (piece && piece.color === turn) {
                const moves = getValidMoves(r, c);
                moves.forEach(move => {
                    allPossibleMoves.push({ from: { row: r, col: c }, to: move, piece });
                });
            }
        });
    });

    if (allPossibleMoves.length === 0) {
        return;
    }

    let bestMove = null;
    const captureMoves = allPossibleMoves.filter(move => board[move.to.row][move.to.col] !== null);
    
    if (captureMoves.length > 0) {
        bestMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
    } else {
        bestMove = allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
    }

    if (bestMove) {
        setHint({ from: bestMove.from, to: bestMove.to });
        setHints(prev => ({ ...prev, [turn]: prev[turn] - 1 }));
    }
  }, [board, turn, hints, gameOver, getValidMoves]);

  return (
    <GameContext.Provider
      value={{
        board,
        turn,
        selectedPiece,
        lastMove,
        roasts,
        isGeneratingRoast,
        gameOver,
        settings,
        setSettings,
        t,
        hints,
        hint,
        isRoastDismissed,
        handleSquareClick,
        resetGame,
        getValidMoves,
        isKingInCheck,
        getHint,
        dismissRoast,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = (): GameState => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
