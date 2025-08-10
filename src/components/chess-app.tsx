'use client';

import { useState, useEffect } from 'react';
import { GameProvider, useGame } from '@/contexts/game-context';
import type { GameSettings } from '@/contexts/game-context';
import { Chessboard } from '@/components/chessboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Slider } from './ui/slider';
import { translations } from '@/lib/localization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GameSidePanel } from './game-side-panel';
import { Settings, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';


type GameStage = 'loading' | 'mode' | 'difficulty' | 'settings' | 'play';

function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <h1 className="text-5xl font-headline text-primary drop-shadow-[0_0_10px_hsl(var(--primary))] animate-pulse">
                Check Roast AI
            </h1>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
}

function GameModeSelection({ onSelect }: { onSelect: (mode: 'pvp' | 'pve') => void }) {
  const t = translations.en;
  return (
    <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center font-headline text-3xl text-primary drop-shadow-[0_0_5px_hsl(var(--primary))]">
          {t.checkmateComedian}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <Label className="text-xl">{t.gameMode}</Label>
        <div className="flex gap-4">
          <Button onClick={() => onSelect('pve')} size="lg">
            {t.playerVsBot}
          </Button>
          <Button onClick={() => onSelect('pvp')} size="lg">
            {t.playerVsPlayer}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DifficultySelection({ onSelect }: { onSelect: (difficulty: GameSettings['botDifficulty']) => void }) {
  const t = translations.en;
  return (
    <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center font-headline text-2xl text-primary drop-shadow-[0_0_5px_hsl(var(--primary))]">
          {t.aiDifficulty}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => onSelect('noob')} size="lg" variant="secondary">Noob</Button>
          <Button onClick={() => onSelect('medium')} size="lg">Medium</Button>
          <Button onClick={() => onSelect('hard')} size="lg" variant="destructive">Hard</Button>
          <Button onClick={() => onSelect('extreme')} size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">Extreme</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsSelection({
  onConfirm,
  initialSettings,
}: {
  onConfirm: (settings: Omit<GameSettings, 'gameMode' | 'botDifficulty'>) => void;
  initialSettings: Omit<GameSettings, 'gameMode' | 'botDifficulty'>;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const t = translations[settings.language === 'Urdu' ? 'ur' : 'en'];

  const handleIntensityChange = (value: number[]) => {
    const intensity =
      value[0] === 0 ? 'low' : value[0] === 1 ? 'medium' : 'high';
    setSettings({ ...settings, intensity });
  };

  const intensityValue =
    settings.intensity === 'low'
      ? [0]
      : settings.intensity === 'medium'
      ? [1]
      : [2];

  return (
    <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center font-headline text-2xl text-primary drop-shadow-[0_0_5px_hsl(var(--primary))]">
          {t.roastIntensity} &amp; {t.language}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-8">
        <div className="space-y-4">
          <Label>{t.roastIntensity}</Label>
          <div className="flex items-center gap-4">
            <span>{t.low}</span>
            <Slider
              value={intensityValue}
              onValueChange={handleIntensityChange}
              max={2}
              step={1}
            />
            <span>{t.high}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t.language}</Label>
          <Select
            value={settings.language}
            onValueChange={(value) =>
              setSettings({
                ...settings,
                language: value as 'English' | 'Urdu',
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">{t.english}</SelectItem>
              <SelectItem value="Urdu">{t.urdu}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => onConfirm(settings)} size="lg">
          {t.startGame}
        </Button>
      </CardContent>
    </Card>
  );
}

function GameOverDialog() {
  const { gameOver, resetGame } = useGame();
  
  const isOpen = gameOver !== null;
  const winner = gameOver?.winner;
  const loser = winner === 'white' ? 'black' : 'white';

  const title = winner === 'draw' ? 'Stalemate!' : `${winner ? winner.charAt(0).toUpperCase() + winner.slice(1) : ''} Wins!`;

  const description = winner === 'draw' 
    ? "A fitting end to a game of... questionable moves. 🙄" 
    : `Congratulations, ${winner}. And to you, ${loser}, better luck next time. You'll need it. And a new strategy. And maybe a new hobby. 🤣`;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={resetGame}>New Game</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function InGameSettings() {
    const { settings, setSettings, resetGame, t } = useGame();

    const handleIntensityChange = (value: number[]) => {
        const intensity =
        value[0] === 0 ? 'low' : value[0] === 1 ? 'medium' : 'high';
        setSettings({ ...settings, intensity });
    };

    const intensityValue =
        settings.intensity === 'low'
        ? [0]
        : settings.intensity === 'medium'
        ? [1]
        : [2];

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-20 text-white hover:bg-white/10 hover:text-white">
                    <Settings className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-background/80 backdrop-blur-sm border-primary/20 text-foreground">
                <SheetHeader>
                    <SheetTitle className="text-primary font-headline text-2xl">{t.settings}</SheetTitle>
                </SheetHeader>
                <div className="space-y-8 py-8">
                     <div className="space-y-4">
                        <Label>{t.roastIntensity}</Label>
                        <div className="flex items-center gap-4">
                            <span>{t.low}</span>
                            <Slider
                            value={intensityValue}
                            onValueChange={handleIntensityChange}
                            max={2}
                            step={1}
                            />
                            <span>{t.high}</span>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>{t.language}</Label>
                        <Select
                            value={settings.language}
                            onValueChange={(value) =>
                            setSettings({
                                ...settings,
                                language: value as 'English' | 'Urdu',
                            })
                            }
                        >
                            <SelectTrigger>
                            <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="English">{t.english}</SelectItem>
                            <SelectItem value="Urdu">{t.urdu}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={resetGame} size="lg" className="w-full">
                        {t.newGame}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function GameScreen() {
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <GameSidePanel side="left" player="white" />
      <Chessboard />
      <GameSidePanel side="right" player="black" />
      <InGameSettings />
      <GameOverDialog />
    </div>
  );
}

function AppContent() {
  const [stage, setStage] = useState<GameStage>('loading');
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    gameMode: 'pve',
    botDifficulty: 'medium',
    intensity: 'medium',
    language: 'English',
  });

  useEffect(() => {
    if (stage === 'loading') {
      const timer = setTimeout(() => {
        setStage('mode');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const handleModeSelect = (mode: 'pvp' | 'pve') => {
    setGameSettings((s) => ({ ...s, gameMode: mode }));
    if (mode === 'pve') {
      setStage('difficulty');
    } else {
      setStage('settings');
    }
  };

  const handleDifficultySelect = (difficulty: GameSettings['botDifficulty']) => {
    setGameSettings(s => ({ ...s, botDifficulty: difficulty }));
    setStage('settings');
  }

  const handleSettingsConfirm = (
    settings: Omit<GameSettings, 'gameMode' | 'botDifficulty'>
  ) => {
    setGameSettings((s) => ({ ...s, ...settings }));
    setStage('play');
  };

  if (stage === 'loading') {
    return <LoadingScreen />;
  }

  if (stage === 'mode') {
    return <GameModeSelection onSelect={handleModeSelect} />;
  }
  
  if (stage === 'difficulty') {
    return <DifficultySelection onSelect={handleDifficultySelect} />;
  }

  if (stage === 'settings') {
    return (
      <SettingsSelection
        onConfirm={handleSettingsConfirm}
        initialSettings={{
          intensity: gameSettings.intensity,
          language: gameSettings.language,
        }}
      />
    );
  }

  return (
    <GameProvider initialSettings={gameSettings}>
      <GameScreen />
    </GameProvider>
  );
}

export function ChessApp() {
    return <AppContent />;
}
