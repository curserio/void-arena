
import { GameState, PersistentData, ShipType, WeaponType, ControlScheme } from './types';
import Joystick from './components/Joystick';
import HUD from './components/HUD';
import UpgradeMenu from './components/UpgradeMenu';
import GarageMenu from './components/GarageMenu';
import UpgradesList from './components/UpgradesList';
import SettingsMenu from './components/SettingsMenu';
import GuideMenu from './components/GuideMenu';
import CheatsMenu from './components/CheatsMenu';
import { useGameLogic } from './hooks/useGameLogic';
import { generateStars, drawBackground, BackgroundStar } from './systems/BackgroundManager';
import { renderGame } from './systems/GameRenderer';
import { GAME_ZOOM } from './constants';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isPaused, setIsPaused] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  const [showUpgradesList, setShowUpgradesList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showCheats, setShowCheats] = useState(false);
  
  // Initialize Persistent Data with Auto-Detection
  const [persistentData, setPersistentData] = useState<PersistentData>(() => {
    const saved = localStorage.getItem('stellar_survivor_v11_rpg');
    let data = saved ? JSON.parse(saved) : {
      credits: 0,
      metaLevels: {},
      unlockedShips: [ShipType.INTERCEPTOR],
      equippedShip: ShipType.INTERCEPTOR,
      equippedWeapon: WeaponType.PLASMA,
      unlockedWeapons: [WeaponType.PLASMA],
      currentLevel: 1,
      currentXp: 0,
      xpToNextLevel: 250,
      acquiredUpgradeIds: [],
    };

    // Ensure settings exist (Migration or New)
    if (!data.settings) {
      data.settings = {
        controlScheme: isTouchDevice() ? ControlScheme.TWIN_STICK : ControlScheme.KEYBOARD_MOUSE
      };
    }
    return data;
  });
  
  const [offeredUpgrades, setOfferedUpgrades] = useState<any[]>([]);

  const stars = useMemo<BackgroundStar[]>(() => generateStars(400), []);

  // PAUSE LOGIC: Game pauses if manually paused OR if any overlay menu is open
  const isGamePaused = isPaused || showGarage || showUpgradesList || showSettings || showGuide || showCheats;

  const {
    stats, score, playerPosRef, cameraPosRef, joystickDirRef, aimDirRef, triggerRef,
    initGame, update, setStats, addUpgrade, statsRef, lastPlayerHitTime, syncWithPersistentData,
    autoAttack, setAutoAttack,
    enemiesRef, projectilesRef, pickupsRef, particlesRef
  } = useGameLogic(
    gameState, setGameState, persistentData, setOfferedUpgrades, isGamePaused
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

  // --- MOUSE & KEYBOARD STATE ---
  const keysPressed = useRef<Set<string>>(new Set());
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isMouseDown = useRef(false);

  // --- REFS FOR GAME LOOP (Prevent Stale Closures) ---
  const persistentDataRef = useRef(persistentData);
  const isPausedRef = useRef(isPaused);
  const gameStateRef = useRef(gameState);
  const autoAttackRef = useRef(autoAttack);
  const showMenusRef = useRef(showGarage || showUpgradesList || showSettings || showGuide || showCheats);

  useEffect(() => { persistentDataRef.current = persistentData; }, [persistentData]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { autoAttackRef.current = autoAttack; }, [autoAttack]);
  useEffect(() => { showMenusRef.current = showGarage || showUpgradesList || showSettings || showGuide || showCheats; }, [showGarage, showUpgradesList, showSettings, showGuide, showCheats]);

  const frame = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.max(0, Math.min(0.05, (time - lastTimeRef.current) / 1000));
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentScheme = persistentDataRef.current.settings.controlScheme;
    const isPausedNow = isPausedRef.current || showMenusRef.current;
    const currentState = gameStateRef.current;
    const isAutoAttack = autoAttackRef.current;

    // --- KEYBOARD/MOUSE INPUT LOGIC ---
    if (currentScheme === ControlScheme.KEYBOARD_MOUSE && !isPausedNow && currentState === GameState.PLAYING) {
        // 1. Movement
        let dx = 0; let dy = 0;
        if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) dy -= 1;
        if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) dy += 1;
        if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) dx -= 1;
        if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) dx += 1;
        
        // Normalize
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) {
            joystickDirRef.current = { x: dx/len, y: dy/len };
        } else {
            joystickDirRef.current = { x: 0, y: 0 };
        }

        // 2. Aiming (Corrected for Camera Position)
        const screenCX = window.innerWidth / 2;
        const screenCY = window.innerHeight / 2;
        const relX = (playerPosRef.current.x - cameraPosRef.current.x);
        const relY = (playerPosRef.current.y - cameraPosRef.current.y);
        const playerScreenX = screenCX + relX * GAME_ZOOM;
        const playerScreenY = screenCY + relY * GAME_ZOOM;

        const vx = mousePos.current.x - playerScreenX;
        const vy = mousePos.current.y - playerScreenY;
        const dist = Math.sqrt(vx*vx + vy*vy);
        
        if (dist > 0) {
            aimDirRef.current = { x: vx/dist, y: vy/dist };
        }

        triggerRef.current = isMouseDown.current || isAutoAttack;
    } 
    else if ((currentScheme === ControlScheme.TWIN_STICK || currentScheme === ControlScheme.TAP_TO_AIM) && !isPausedNow) {
        triggerRef.current = true; 
    }

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
      aimDirRef.current, 
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

  const onKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.code);
  const onKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.code);
  const onMouseMove = (e: MouseEvent) => mousePos.current = { x: e.clientX, y: e.clientY };
  const onMouseDown = () => isMouseDown.current = true;
  const onMouseUp = () => isMouseDown.current = false;

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  lastTimeRef.current = performance.now();
  requestRef.current = requestAnimationFrame(frame);

  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
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

const aimTouchIdRef = useRef<number | null>(null);

const handleTapAimInput = useCallback((clientX: number, clientY: number) => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 0) {
    aimDirRef.current = { x: dx / dist, y: dy / dist };
  }
}, [aimDirRef]);

const handleAimLayerTouchStart = useCallback((e: React.TouchEvent) => {
  if (persistentData.settings?.controlScheme === ControlScheme.TWIN_STICK) return;
  const touch = e.changedTouches[0];
  aimTouchIdRef.current = touch.identifier;
  handleTapAimInput(touch.clientX, touch.clientY);
}, [persistentData.settings, handleTapAimInput]);

const handleAimLayerTouchMove = useCallback((e: React.TouchEvent) => {
  if (persistentData.settings?.controlScheme === ControlScheme.TWIN_STICK) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === aimTouchIdRef.current) {
       handleTapAimInput(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
       break;
    }
  }
}, [persistentData.settings, handleTapAimInput]);

const handleAimLayerTouchEnd = useCallback((e: React.TouchEvent) => {
  if (persistentData.settings?.controlScheme === ControlScheme.TWIN_STICK) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === aimTouchIdRef.current) {
       aimTouchIdRef.current = null;
       aimDirRef.current = { x: 0, y: 0 }; 
       break;
    }
  }
}, [persistentData.settings, aimDirRef]);

const handleAimLayerMouseDown = useCallback((e: React.MouseEvent) => {
    if (persistentData.settings?.controlScheme !== ControlScheme.TAP_TO_AIM) return;
    aimTouchIdRef.current = 999;
    handleTapAimInput(e.clientX, e.clientY);
}, [persistentData.settings, handleTapAimInput]);

const handleAimLayerMouseMove = useCallback((e: React.MouseEvent) => {
    if (persistentData.settings?.controlScheme !== ControlScheme.TAP_TO_AIM) return;
    if (aimTouchIdRef.current === 999) {
        handleTapAimInput(e.clientX, e.clientY);
    }
}, [persistentData.settings, handleTapAimInput]);

const handleAimLayerMouseUp = useCallback(() => {
    if (persistentData.settings?.controlScheme !== ControlScheme.TAP_TO_AIM) return;
    if (aimTouchIdRef.current === 999) {
        aimTouchIdRef.current = null;
        aimDirRef.current = { x: 0, y: 0 };
    }
}, [persistentData.settings, aimDirRef]);

const currentScheme = persistentData.settings?.controlScheme || ControlScheme.TWIN_STICK;

return (
  <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
    <canvas ref={canvasRef} className="absolute inset-0" />

    {gameState === GameState.START && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-lg z-[200]">
        <h1 className="text-cyan-400 text-7xl font-black italic uppercase mb-2 drop-shadow-[0_0_40px_rgba(6,182,212,0.9)] text-center">Void Arena</h1>
        <div className="flex flex-col gap-4 w-full max-w-xs mt-12">
          <button onClick={initGame} className="py-6 bg-cyan-500 text-slate-950 font-black text-2xl rounded-2xl active:scale-95 transition-all shadow-lg shadow-cyan-500/20">START MISSION</button>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setShowGarage(true)} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95 transition-all">GARAGE</button>
            <button onClick={() => setShowGuide(true)} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95 transition-all">MANUAL</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => setShowSettings(true)} className="py-3 bg-slate-900 text-slate-400 font-bold text-sm rounded-xl border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-gear" /> SETTINGS
              </button>
              <button onClick={() => setShowCheats(true)} className="py-3 bg-slate-950 text-red-900 font-bold text-sm rounded-xl border border-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-code" /> CHEATS
              </button>
          </div>
        </div>

        <div className="mt-12 text-amber-400 font-black text-xl flex items-center gap-2">
          <i className="fas fa-coins" />
          <span>{persistentData.credits.toLocaleString()} CREDITS</span>
        </div>
        <div className="mt-2 text-cyan-400/60 font-bold text-sm uppercase tracking-widest">
           RANK: LV {persistentData.currentLevel || 1}
        </div>

        <div className="absolute bottom-6 text-slate-600 font-bold text-xs tracking-widest opacity-50">
          v0.1.0
        </div>
      </div>
    )}

    {isPaused && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-2xl z-[250]">
        <h2 className="text-white text-6xl font-black italic uppercase mb-12">Paused</h2>
        <div className="flex flex-col gap-4 w-full max-w-xs px-6">
          <button onClick={() => setIsPaused(false)} className="py-6 bg-cyan-500 text-slate-950 font-black text-2xl rounded-2xl active:scale-95 shadow-xl">RESUME</button>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { setShowGarage(true); setIsPaused(false); }} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">GARAGE</button>
            <button onClick={() => setShowGuide(true)} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">MANUAL</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setShowSettings(true)} className="py-3 bg-slate-900 text-slate-400 font-bold text-sm rounded-xl border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
              <i className="fa-solid fa-gear" /> SETTINGS
            </button>
             <button onClick={() => setShowCheats(true)} className="py-3 bg-slate-950 text-red-900 font-bold text-sm rounded-xl border border-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-code" /> CHEATS
              </button>
          </div>

          <button onClick={handleManualAbort} className="py-4 bg-red-900/50 text-white font-black text-xl rounded-2xl border border-red-500/30 active:scale-95 mt-4">SAVE & EXIT</button>
        </div>
      </div>
    )}

    {showSettings && (
      <SettingsMenu 
        data={persistentData}
        onUpdate={setPersistentData}
        onClose={() => setShowSettings(false)}
      />
    )}

    {showGuide && (
      <GuideMenu onClose={() => setShowGuide(false)} />
    )}

    {showCheats && (
      <CheatsMenu 
        data={persistentData} 
        onUpdate={setPersistentData} 
        onClose={() => setShowCheats(false)} 
      />
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
        <h2 className="text-white text-7xl font-black uppercase mb-8 italic tracking-tighter text-center">Mission Failed</h2>
        <div className="bg-amber-400/10 border border-amber-400/30 px-8 py-4 rounded-2xl text-amber-400 font-black text-4xl mb-4">
          Salvage: +{Math.floor(stats.credits)} C
        </div>
        <div className="text-slate-400 font-bold mb-12 uppercase tracking-widest text-center">
            Progress Saved. Rank {stats.level}.
        </div>
        <button onClick={() => setGameState(GameState.START)} className="px-16 py-6 bg-white text-red-900 font-black text-3xl rounded-full shadow-2xl active:scale-95 transition-all">RETURN TO BASE</button>
      </div>
    )}

    {gameState === GameState.LEVELING && (
      <UpgradeMenu upgrades={offeredUpgrades} onSelect={(u) => { addUpgrade(u); setGameState(GameState.PLAYING); }} />
    )}

    {(gameState === GameState.PLAYING || gameState === GameState.LEVELING) && !isGamePaused && (
      <>
        {currentScheme === ControlScheme.TAP_TO_AIM && (
          <div 
             className="absolute inset-0 z-30 touch-none cursor-crosshair"
             onTouchStart={handleAimLayerTouchStart}
             onTouchMove={handleAimLayerTouchMove}
             onTouchEnd={handleAimLayerTouchEnd}
             onMouseDown={handleAimLayerMouseDown}
             onMouseMove={handleAimLayerMouseMove}
             onMouseUp={handleAimLayerMouseUp}
          />
        )}

        {currentScheme === ControlScheme.TWIN_STICK && (
            <Joystick 
                className="absolute left-0 bottom-0 w-1/2 h-[60%] z-40" 
                onMove={(dir) => aimDirRef.current = dir} 
            />
        )}
        
        {(currentScheme === ControlScheme.TWIN_STICK || currentScheme === ControlScheme.TAP_TO_AIM) && (
             <Joystick 
                className="absolute right-0 bottom-0 w-1/2 h-[60%] z-40" 
                onMove={(dir) => joystickDirRef.current = dir} 
            />
        )}

        <HUD
          stats={stats}
          score={score}
          autoAttack={autoAttack}
          setAutoAttack={setAutoAttack}
          onPause={() => setIsPaused(true)}
          onShowUpgrades={() => setShowUpgradesList(true)}
          onOpenGarage={() => setShowGarage(true)}
        />
      </>
    )}
  </div>
);
};

export default App;
