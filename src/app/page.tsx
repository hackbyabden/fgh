'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ChessApp = dynamic(() => import('@/components/chess-app').then(mod => mod.ChessApp), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100svh] w-screen items-center justify-center bg-background">
       <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

export default function Home() {
  return (
    <main className="flex h-[100svh] w-screen flex-col items-center justify-center overflow-hidden bg-background">
      <ChessApp />
    </main>
  );
}
