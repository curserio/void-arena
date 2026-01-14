
import { GameState, PersistentData, ShipType, WeaponType } from './types';
import Joystick from './components/Joystick';
import HUD from './components/HUD';
import UpgradeMenu from './components/UpgradeMenu';
import GarageMenu from './components/GarageMenu';
import UpgradesList from './components/UpgradesList';
import { useGameLogic } from './hooks/useGameLogic';
import { generateStars, drawBackground, BackgroundStar } from './systems/BackgroundManager';
import { renderGame } from './systems/GameRenderer';
import React, { useEffect, useRef, useState, useMemo } from 'react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isPaused, setIsPaused] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  const [showUpgradesList, setShowUpgradesList] = useState(false);
  
  // Initialize Persistent Data
  const [persistentData, setPersistentData] = useState<PersistentData>(() => {
    const saved = localStorage.getItem('stellar_survivor_v11_rpg');
    return saved ? JSON.parse(saved) : {
      credits: 0, // Removed debug millions
      metaLevels: {},
      unlockedShips: [ShipType.INTERCEPTOR],
      equippedShip: ShipType.INTERCEPTOR,
      equippedWeapon: WeaponType.PLASMA,
      unlockedWeapons: [WeaponType.PLASMA],
      currentLevel: 1,
      currentXp: 0,
      xpToNextLevel: 250,
      acquiredUpgradeIds: []
    };
  });
  
  const [offeredUpgrades, setOfferedUpgrades] = useState<any[]>([]);

  const stars = useMemo<BackgroundStar[]>(() => generateStars(400), []);

  const {
    stats, score, playerPosRef, cameraPosRef, joystickDirRef,
    initGame, update, setStats, addUpgrade, statsRef, lastPlayerHitTime, syncWithPersistentData,
    autoAttack, setAutoAttack,
    enemiesRef, projectilesRef, pickupsRef, particlesRef
  } = useGameLogic(
    gameState, setGameState, persistentData, setOfferedUpgrades, isPaused || showGarage
  );

  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  useEffect(() => {
    localStorage.setItem('stellar_survivor_v11_rpg', JSON.stringify(persistentData));
  }, [persistentData]);

  // Handle Death / Game Over persistence
  useEffect(() => {
    if (gameState === GameState.PLAYING && stats.currentHealth <= 0) {
      // Save RPG progress on death
      setPersistentData(p => ({ 
        ...p, 
        credits: p.credits + stats.credits,
        // Persist level/xp/upgrades even on death (RPG style)
        currentLevel: stats.level,
        currentXp: stats.xp,
        xpToNextLevel: stats.xpToNextLevel,
        acquiredUpgradeIds: stats.acquiredUpgrades.map(u => u.id)
      }));
      setGameState(GameState.GAMEOVER);
    }
  }, [stats.currentHealth, gameState, stats.credits, stats.level, stats.xp, stats.xpToNextLevel, stats.acquiredUpgrades]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const frame = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.max(0, Math.min(0.05, (time - lastTimeRef.current) / 1000));
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateRef.current(time, dt);

    const vOX = canvas.width / 2 - cameraPosRef.current.x;
    const vOY = canvas.height / 2 - cameraPosRef.current.y;

    drawBackground(ctx, canvas.width, canvas.height, vOX, vOY, stars);

    renderGame(
      ctx,
      canvas,
      enemiesRef.current,
      projectilesRef.current,
      pickupsRef.current,
      particlesRef.current,
      playerPosRef.current,
      cameraPosRef.current,
      statsRef.current,
      joystickDirRef.current,
      time,
      lastPlayerHitTime.current
    );

    requestRef.current = requestAnimationFrame(frame);
  };


useEffect(() => {
  const handleResize = () => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
  };
  window.addEventListener('resize', handleResize);
  handleResize();

  lastTimeRef.current = performance.now();
  requestRef.current = requestAnimationFrame(frame);

  return () => {
    window.removeEventListener('resize', handleResize);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };
}, []);

const handleGarageUpdate = (newData: PersistentData, spentSession: number) => {
  if (spentSession > 0) {
    setStats(prev => ({ ...prev, credits: Math.max(0, prev.credits - spentSession) }));
  }
  setPersistentData(newData);
  if (gameState === GameState.PLAYING || gameState === GameState.LEVELING) {
    syncWithPersistentData(newData);
  }
};

const handleManualAbort = () => {
  // Save progress on manual exit
  setPersistentData(p => ({ 
    ...p, 
    credits: p.credits + stats.credits,
    currentLevel: stats.level,
    currentXp: stats.xp,
    xpToNextLevel: stats.xpToNextLevel,
    acquiredUpgradeIds: stats.acquiredUpgrades.map(u => u.id)
  }));
  setGameState(GameState.START);
  setIsPaused(false);
};

return (
  <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
    <canvas ref={canvasRef} className="absolute inset-0" />

    {gameState === GameState.START && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-lg z-[200]">
        <h1 className="text-cyan-400 text-7xl font-black italic uppercase mb-2 drop-shadow-[0_0_40px_rgba(6,182,212,0.9)] text-center">Neon Reach</h1>
        <div className="flex flex-col gap-5 w-full max-w-xs mt-12">
          <button onClick={initGame} className="py-6 bg-cyan-500 text-slate-950 font-black text-2xl rounded-2xl active:scale-95 transition-all shadow-lg shadow-cyan-500/20">START MISSION</button>
          <button onClick={() => setShowGarage(true)} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95 transition-all">CMD GARAGE</button>
        </div>
        <div className="mt-12 text-amber-400 font-black text-xl flex items-center gap-2">
          <i className="fas fa-coins" />
          <span>{persistentData.credits.toLocaleString()} CREDITS</span>
        </div>
        <div className="mt-2 text-cyan-400/60 font-bold text-sm">
           CURRENT RANK: LV {persistentData.currentLevel || 1}
        </div>
      </div>
    )}

    {isPaused && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-2xl z-[250]">
        <h2 className="text-white text-6xl font-black italic uppercase mb-12">Paused</h2>
        <div className="flex flex-col gap-5 w-full max-w-xs px-6">
          <button onClick={() => setIsPaused(false)} className="py-6 bg-cyan-500 text-slate-950 font-black text-2xl rounded-2xl active:scale-95 shadow-xl">RESUME</button>
          <button onClick={() => { setShowGarage(true); setIsPaused(false); }} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">CMD GARAGE</button>
          <button onClick={handleManualAbort} className="py-4 bg-red-900/50 text-white font-black text-xl rounded-2xl border border-red-500/30 active:scale-95">SAVE & EXIT</button>
        </div>
      </div>
    )}

    {showGarage && (
      <GarageMenu
        data={persistentData}
        sessionCredits={gameState === GameState.PLAYING ? stats.credits : 0}
        onUpdate={handleGarageUpdate}
        onApplyEffect={setStats}
        onClose={() => setShowGarage(false)}
      />
    )}

    {showUpgradesList && (
      <UpgradesList acquired={stats.acquiredUpgrades} onClose={() => setShowUpgradesList(false)} />
    )}

    {gameState === GameState.GAMEOVER && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-xl z-[200]">
        <h2 className="text-white text-7xl font-black uppercase mb-8 italic tracking-tighter">Mission Failed</h2>
        <div className="bg-amber-400/10 border border-amber-400/30 px-8 py-4 rounded-2xl text-amber-400 font-black text-4xl mb-4">
          Salvage: +{Math.floor(stats.credits)} C
        </div>
        <div className="text-slate-400 font-bold mb-12 uppercase tracking-widest">
            Progress Saved. Rank {stats.level}.
        </div>
        <button onClick={() => setGameState(GameState.START)} className="px-16 py-6 bg-white text-red-900 font-black text-3xl rounded-full shadow-2xl">RETURN TO BASE</button>
      </div>
    )}

    {gameState === GameState.LEVELING && (
      <UpgradeMenu upgrades={offeredUpgrades} onSelect={(u) => { addUpgrade(u); setGameState(GameState.PLAYING); }} />
    )}

    {(gameState === GameState.PLAYING || gameState === GameState.LEVELING) && !isPaused && !showGarage && (
      <>
        <HUD
          stats={stats}
          score={score}
          autoAttack={autoAttack}
          setAutoAttack={setAutoAttack}
          onPause={() => setIsPaused(true)}
          onShowUpgrades={() => setShowUpgradesList(true)}
          onOpenGarage={() => setShowGarage(true)}
        />
        <Joystick onMove={(dir) => joystickDirRef.current = dir} />
      </>
    )}
  </div>
);
};

export default App;
