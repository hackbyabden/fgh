import type { Board, Piece, Square } from './constants';

const cloneBoard = (board: Board): Board =>
  board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));

function isOutOfBounds(row: number, col: number): boolean {
  return row < 0 || row > 7 || col < 0 || col > 7;
}

// Finds the king on the board
function findKing(color: 'white' | 'black', board: Board): Square | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

// Checks if a square is under attack by the opponent
function isSquareAttacked(square: Square, attackerColor: 'white' | 'black', board: Board): boolean {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === attackerColor) {
                // We use the basic piece movement logic here, without filtering for check,
                // to avoid infinite recursion.
                const moves = getRawPossibleMoves(piece, { row: r, col: c }, board, null);
                if (moves.some(move => move.row === square.row && move.col === square.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function isKingInCheck(kingColor: 'white' | 'black', board: Board): Square | null {
    const kingPos = findKing(kingColor, board);
    if (!kingPos) return null; // Should not happen in a real game
    
    const opponentColor = kingColor === 'white' ? 'black' : 'white';
    if (isSquareAttacked(kingPos, opponentColor, board)) {
        return kingPos;
    }
    
    return null;
}

export function doesMoveExposeKing(from: Square, to: Square, kingColor: 'white' | 'black', board: Board): boolean {
    const testBoard = cloneBoard(board);
    const piece = testBoard[from.row][from.col];
    
    if (!piece) return false;

    // Simulate the move
    testBoard[to.row][to.col] = piece;
    testBoard[from.row][from.col] = null;

    return !!isKingInCheck(kingColor, testBoard);
}

// This is the main function to get valid moves for a piece
export function getPossibleMoves(
  piece: Piece,
  from: Square,
  board: Board,
  lastMove: { from: Square; to: Square } | null
): Square[] {
  const rawMoves = getRawPossibleMoves(piece, from, board, lastMove);
  
  // Filter out moves that would leave the king in check.
  return rawMoves.filter(to => !doesMoveExposeKing(from, to, piece.color, board));
}


// This function gets all possible moves without checking for king's safety
function getRawPossibleMoves(
  piece: Piece,
  from: Square,
  board: Board,
  lastMove: { from: Square; to: Square } | null,
): Square[] {
  switch (piece.type) {
    case 'pawn':
      return getPawnMoves(piece, from, board, lastMove);
    case 'rook':
      return getRookMoves(piece, from, board);
    case 'knight':
      return getKnightMoves(piece, from, board);
    case 'bishop':
      return getBishopMoves(piece, from, board);
    case 'queen':
      return getQueenMoves(piece, from, board);
    case 'king':
      return getKingMoves(piece, from, board);
    default:
      return [];
  }
}

function getPawnMoves(
  piece: Piece,
  from: Square,
  board: Board,
  lastMove: { from: Square; to: Square } | null
): Square[] {
  const moves: Square[] = [];
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;

  // 1. Forward move
  if (
    !isOutOfBounds(from.row + direction, from.col) &&
    !board[from.row + direction][from.col]
  ) {
    moves.push({ row: from.row + direction, col: from.col });
    // 2. Double forward move from start
    if (
      from.row === startRow &&
      !board[from.row + 2 * direction]?.[from.col]
    ) {
      moves.push({ row: from.row + 2 * direction, col: from.col });
    }
  }

  // 3. Capture moves
  const captureOffsets = [-1, 1];
  for (const offset of captureOffsets) {
    const newRow = from.row + direction;
    const newCol = from.col + offset;
    if (!isOutOfBounds(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (targetPiece && targetPiece.color !== piece.color) {
        moves.push({ row: newRow, col: newCol });
      }
      // 4. En passant
      if (lastMove) {
        // The piece that just moved must be a pawn of the opposite color
        const lastMovedPiece = board[lastMove.to.row]?.[lastMove.to.col];

        if (
          lastMovedPiece?.type === 'pawn' &&
          lastMovedPiece.color !== piece.color &&
          // It must have moved two squares
          Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
          // It must be on the same row as the current pawn
          lastMove.to.row === from.row &&
          // It must be in the column the current pawn is attacking
          lastMove.to.col === newCol &&
          // The square behind the moved pawn must be empty
          !board[newRow][newCol]
        ) {
          // Special case for en passant: the captured piece is not on the 'to' square
          const capturedPawnSquare = { row: from.row, col: newCol };
          // We can add the move
          moves.push({ row: newRow, col: newCol });
        }
      }
    }
  }

  return moves;
}

function getRookMoves(piece: Piece, from: Square, board: Board): Square[] {
  return getSlidingMoves(piece, from, board, [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]);
}

function getBishopMoves(piece: Piece, from: Square, board: Board): Square[] {
  return getSlidingMoves(piece, from, board, [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]);
}

function getQueenMoves(piece: Piece, from: Square, board: Board): Square[] {
  return getSlidingMoves(piece, from, board, [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]);
}

function getSlidingMoves(
  piece: Piece,
  from: Square,
  board: Board,
  directions: number[][]
): Square[] {
  const moves: Square[] = [];
  for (const [rowDir, colDir] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRow = from.row + i * rowDir;
      const newCol = from.col + i * colDir;

      if (isOutOfBounds(newRow, newCol)) break;

      const targetPiece = board[newRow][newCol];
      if (targetPiece) {
        if (targetPiece.color !== piece.color) {
          moves.push({ row: newRow, col: newCol });
        }
        break; // Stop if we hit any piece
      }
      moves.push({ row: newRow, col: newCol });
    }
  }
  return moves;
}

function getKnightMoves(piece: Piece, from: Square, board: Board): Square[] {
  const moves: Square[] = [];
  const offsets = [
    [1, 2], [1, -2], [-1, 2], [-1, -2],
    [2, 1], [2, -1], [-2, 1], [-2, -1],
  ];

  for (const [rowOffset, colOffset] of offsets) {
    const newRow = from.row + rowOffset;
    const newCol = from.col + colOffset;

    if (!isOutOfBounds(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  return moves;
}

function getKingMoves(piece: Piece, from: Square, board: Board): Square[] {
  const moves: Square[] = [];
  const offsets = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];

  for (const [rowOffset, colOffset] of offsets) {
    const newRow = from.row + rowOffset;
    const newCol = from.col + colOffset;

    if (!isOutOfBounds(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  // TODO: Add castling logic
  return moves;
}
