'use client';

import { useGame } from '@/contexts/game-context';
import { cn } from '@/lib/utils';
import { Piece } from './chess-pieces';
import type { Piece as PieceType } from '@/lib/constants';

export function Chessboard() {
  const { board, selectedPiece, handleSquareClick, lastMove, turn, getValidMoves, isKingInCheck, hint } = useGame();
  
  const validMoves = selectedPiece ? getValidMoves(selectedPiece.row, selectedPiece.col) : [];
  const checkPosition = isKingInCheck(turn);

  return (
    <div className="chess-board grid w-full max-w-[calc(100svh_-_2rem)] md:max-w-[calc(100svh_-_8rem)] grid-cols-8 grid-rows-8 overflow-hidden rounded-lg border-2 border-primary/50 shadow-[0_0_60px_theme(colors.primary/0.7),0_0_20px_theme(colors.primary/0.5)_inset]">
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isLight = (rowIndex + colIndex) % 2 !== 0;
          const isSelected =
            selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
          const isLastMove =
            (lastMove?.from.row === rowIndex &&
              lastMove?.from.col === colIndex) ||
            (lastMove?.to.row === rowIndex && lastMove?.to.col === colIndex);
            
          const isValidMove = validMoves.some(m => m.row === rowIndex && m.col === colIndex);
          const isChecked = checkPosition && checkPosition.row === rowIndex && checkPosition.col === colIndex;

          const isHintFrom = hint?.from.row === rowIndex && hint?.from.col === colIndex;
          const isHintTo = hint?.to.row === rowIndex && hint?.to.col === colIndex;

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                'flex items-center justify-center',
                isLight ? 'bg-blue-950/30' : 'bg-slate-950/50',
                'transition-colors duration-300'
              )}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              <div
                className={cn(
                  'relative flex h-full w-full cursor-pointer items-center justify-center',
                  isSelected && 'bg-primary/40',
                  isLastMove && 'bg-accent/40',
                  isChecked && 'bg-red-500/50 animate-pulse',
                  (isHintFrom || isHintTo) && 'bg-green-500/40 animate-pulse',
                  piece && piece.color === turn && 'cursor-grab'
                )}
              >
                {piece && (
                  <Piece
                    type={piece.type as PieceType['type']}
                    color={piece.color as PieceType['color']}
                  />
                )}
                {isValidMove && (
                  <div className="absolute flex items-center justify-center h-full w-full">
                    <div className="h-1/3 w-1/3 rounded-full bg-primary/70 opacity-50"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
