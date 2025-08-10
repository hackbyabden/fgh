'use client';

import { useGame } from '@/contexts/game-context';
import { cn } from '@/lib/utils';
import { Lightbulb, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

export function GameSidePanel({
  side,
  player,
}: {
  side: 'left' | 'right';
  player: 'white' | 'black';
}) {
  const { turn, roasts, isGeneratingRoast, t, hints, getHint, dismissRoast, isRoastDismissed, settings } = useGame();

  const isMyTurn = turn === player;
  const roastsToShow = roasts[player];
  const hasRoasts = roastsToShow.length > 0 && !isRoastDismissed[player] && roastsToShow[0] !== '';
  
  const showThinkingBubble = settings.gameMode === 'pve' && turn === 'black' && player === 'black' && !isGeneratingRoast && roastsToShow.length === 1 && roastsToShow[0] === t.botRoast;
  
  const showBubble = (hasRoasts && roastsToShow[0] !== t.initialRoast && roastsToShow[0] !== t.botRoast) || (isGeneratingRoast && isMyTurn) || showThinkingBubble;


  const bubbleClasses = cn(
    'relative min-h-[80px] w-full max-w-[200px] rounded-lg border bg-card/80 p-3 text-card-foreground shadow-lg transition-all duration-500',
    'absolute top-1/2 -translate-y-1/2 z-10',
    side === 'left' ? 'border-primary/30' : 'border-accent/30',
    showBubble ? 'opacity-100' : 'opacity-0 pointer-events-none',
    side === 'left'
      ? showBubble
        ? 'left-4'
        : '-left-full'
      : showBubble
      ? 'right-4'
      : '-right-full'
  );

  const pointerClasses = cn(
    'absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-card/80 border-t border-r transform',
    side === 'left'
      ? 'right-[-8.5px] -rotate-45 border-primary/30'
      : 'left-[-8.5px] rotate-[135deg] border-accent/30'
  );

  const getRoastContent = () => {
    if (isGeneratingRoast && isMyTurn) {
      return (
        <div className="flex h-full min-h-[80px] items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm">{t.generatingRoast}</p>
        </div>
      );
    }

    if (showThinkingBubble) {
        return (
            <div className="flex h-full min-h-[80px] items-center justify-center">
                 <p className="italic text-sm text-foreground/80 text-center">{t.botRoast}</p>
            </div>
        )
    }

    return (
      <ScrollArea className="w-full max-h-[calc(100svh_-_12rem)]">
         <div className="flex flex-col-reverse p-4">
            {roastsToShow.filter(r => r && r !== t.initialRoast && r !== t.botRoast).map((roast, index) => (
                <p key={index} className="italic text-sm text-foreground/80 text-center mb-4 last:mb-0">
                    {roast}
                </p>
            ))}
        </div>
      </ScrollArea>
    );
  };

  const hintButtonContainerClasses = cn(
    'absolute flex justify-center pointer-events-auto',
    player === 'white'
      ? 'bottom-4 left-4'
      : 'top-4 left-4'
  );

  const canGetHint = turn === player && hints[player] > 0;
  const hintCount = hints[player];

  return (
    <div
      className={cn(
        'absolute h-full w-1/3 md:w-1/4 flex flex-col justify-center pointer-events-none',
        side === 'left' ? 'left-0 items-start' : 'right-0 items-end'
      )}
    >
      {/* Roast Bubble */}
      <div className={bubbleClasses}>
        <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 text-foreground/50 hover:bg-transparent hover:text-foreground z-20 pointer-events-auto"
            onClick={() => dismissRoast(player)}
        >
            <X className="h-4 w-4" />
        </Button>
        <div className={pointerClasses} />
        {getRoastContent()}
      </div>

      {/* Hint button */}
      <div className={hintButtonContainerClasses}>
        <Button
          onClick={getHint}
          disabled={!canGetHint}
          variant="outline"
          className="gap-2 bg-background/50 backdrop-blur-sm"
        >
          <Lightbulb className="h-5 w-5" />
          {t.hint} ({hintCount})
        </Button>
      </div>
    </div>
  );
}
