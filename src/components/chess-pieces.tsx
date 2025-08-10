import * as React from 'react';
import type { Piece as PieceType } from '@/lib/constants';

const SvgWrapper = ({ children }: { children: React.ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className="h-full w-full"
  >
    <defs>
      <filter id="glow-primary" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="glow" />
        <feComposite in="glow" in2="SourceGraphic" operator="over" />
      </filter>
    </defs>
    {children}
  </svg>
);

const piecePaths = {
  pawn: (
     <g strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="50" r="16" />
      </g>
  ),
  rook: (
      <g strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M25,25 h50 v10 h-10 v10 h10 v10 h-10 v10 h10 v10 h-50 z" />
        <path d="M30,30 h10 v-5 h-10 z" />
        <path d="M45,30 h10 v-5 h-10 z" />
        <path d="M60,30 h10 v-5 h-10 z" />
      </g>
  ),
  knight: (
    <g strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50,20 l15,40 h-30 z" />
        <path d="M50,80 v-20" />
      </g>
  ),
  bishop: (
     <g strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
       <polygon points="50,20 70,70 30,70" />
      </g>
  ),
  queen: (
    <g strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M25 75 L35 45 L45 65 L55 45 L65 65 L75 45 L85 75" strokeWidth="3" />
        <path d="M20 25 h60" />
      </g>
  ),
  king: (
    <g strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="35" y="45" width="30" height="35" />
        <polygon points="50,20 65,45 35,45" />
        <line x1="50" y1="20" x2="50" y2="10" />
        <line x1="45" y1="15" x2="55" y2="15" />
      </g>
  ),
};

const PieceComponent = ({
  type,
  color,
}: {
  type: keyof typeof piecePaths;
  color: 'white' | 'black';
}) => {
  const stroke = color === 'white' ? 'hsl(var(--accent))' : 'hsl(var(--primary))';
  const filter = 'url(#glow-primary)';

  const clonedElement = React.cloneElement(piecePaths[type], {
      stroke: stroke,
      fill: "none",
      filter: filter,
  });

  return (
    <SvgWrapper>
      {clonedElement}
    </SvgWrapper>
  );
};

export function Piece({ type, color }: PieceType) {
  return <PieceComponent type={type} color={color} />;
}
