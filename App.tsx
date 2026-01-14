
import { GameState, PersistentData, ShipType, WeaponType, ControlScheme, HighScoreEntry, GameDifficulty } from './types';
import { DIFFICULTY_CONFIGS } from './constants';
import Joystick from './components/Joystick';
import HUD from './components/HUD';
import UpgradeMenu from './components/UpgradeMenu';
import GarageMenu from './components/GarageMenu';
import UpgradesList from './components/UpgradesList';
import SettingsMenu from './components/SettingsMenu';
import GuideMenu from './components/GuideMenu';
import CheatsMenu from './components/CheatsMenu';
import LeaderboardMenu from './components/LeaderboardMenu';
import { useGameLogic } from './hooks/useGameLogic';
import { generateStars, drawBackground, BackgroundStar } from './systems/BackgroundManager';
import { renderGame } from './systems/GameRenderer';
import { GAME_ZOOM } from './constants';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const DEFAULT_DATA: PersistentData = {
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
  highScores: [],
  settings: {
    controlScheme: isTouchDevice() ? ControlScheme.TWIN_STICK : ControlScheme.KEYBOARD_MOUSE
  }
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isPaused, setIsPaused] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  const [showUpgradesList, setShowUpgradesList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showCheats, setShowCheats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Difficulty Selection State
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>(GameDifficulty.NORMAL);

  // High Score Entry State
  const [newHighScoreName, setNewHighScoreName] = useState('');
  const [pendingHighScore, setPendingHighScore] = useState<{score: number, rank: number} | null>(null);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  
  // Initialize Persistent Data with Auto-Detection and Migration
  const [persistentData, setPersistentData] = useState<PersistentData>(() => {
    const saved = localStorage.getItem('stellar_survivor_v11_rpg');
    let data = saved ? JSON.parse(saved) : DEFAULT_DATA;

    // Ensure settings exist (Migration or New)
    if (!data.settings) {
      data.settings = {
        controlScheme: isTouchDevice() ? ControlScheme.TWIN_STICK : ControlScheme.KEYBOARD_MOUSE
      };
    }
    
    // Migration: Convert old number[] scores to HighScoreEntry[] objects
    if (!data.highScores) {
        data.highScores = [];
    } else if (data.highScores.length > 0 && typeof data.highScores[0] === 'number') {
        data.highScores = (data.highScores as unknown as number[]).map(s => ({
            name: 'Unknown',
            score: s,
            date: Date.now()
        }));
    }

    return data;
  });
  
  const [offeredUpgrades, setOfferedUpgrades] = useState<any[]>([]);

  const stars = useMemo<BackgroundStar[]>(() => generateStars(400), []);

  // PAUSE LOGIC: Game pauses if manually paused OR if any overlay menu is open
  const isGamePaused = isPaused || showGarage || showUpgradesList || showSettings || showGuide || showCheats || showLeaderboard;

  const {
    stats, score, playerPosRef, cameraPosRef, joystickDirRef, aimDirRef, triggerRef,
    initGame, update, setStats, addUpgrade, statsRef, lastPlayerHitTime, syncWithPersistentData,
    autoAttack, setAutoAttack,
    enemiesRef, projectilesRef, pickupsRef, particlesRef
  } = useGameLogic(
    gameState, setGameState, persistentData, setOfferedUpgrades, isGamePaused, selectedDifficulty
  );

  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  useEffect(() => {
    localStorage.setItem('stellar_survivor_v11_rpg', JSON.stringify(persistentData));
  }, [persistentData]);

  // Handle Death / Game Over persistence logic
  // This effect runs once when health drops <= 0
  useEffect(() => {
    if (gameState === GameState.PLAYING && stats.currentHealth <= 0) {
      
      // 1. Save RPG Progress (Credits, XP) immediately
      setPersistentData(p => ({ 
        ...p, 
        credits: p.credits + stats.credits,
        currentLevel: stats.level,
        currentXp: stats.xp,
        xpToNextLevel: stats.xpToNextLevel,
        acquiredUpgradeIds: stats.acquiredUpgrades.map(u => u.id)
      }));

      // 2. Determine Leaderboard status
      // We do NOT save to highScores array yet. We wait for user input.
      const currentScores = persistentData.highScores || [];
      const newScore = score;
      
      // Sort existing to be safe
      const sorted = [...currentScores].sort((a, b) => b.score - a.score);
      
      // Determine Rank
      let rank = -1;
      if (sorted.length < 10) {
          // If less than 10 scores, we definitely qualify (assuming score > 0)
          rank = sorted.filter(s => s.score > newScore).length + 1;
      } else {
          // Check if we beat the 10th score
          if (newScore > sorted[9].score) {
               rank = sorted.filter(s => s.score > newScore).length + 1;
          }
      }

      if (rank !== -1 && newScore > 0) {
          setPendingHighScore({ score: newScore, rank });
          setNewHighScoreName(`Pilot-${Math.floor(Math.random()*1000)}`);
          setHasSubmittedScore(false);
      } else {
          setPendingHighScore(null);
          setHasSubmittedScore(true); // Technically false, but we skip the input screen
      }

      setGameState(GameState.GAMEOVER);
    }
  }, [stats.currentHealth, gameState, stats.credits, stats.level, stats.xp, stats.xpToNextLevel, stats.acquiredUpgrades, score]);

  const submitScore = () => {
      if (!pendingHighScore) return;
      
      const entry: HighScoreEntry = {
          name: newHighScoreName.substring(0, 12).toUpperCase() || 'UNKNOWN',
          score: pendingHighScore.score,
          date: Date.now(),
          ship: stats.shipType,
          difficulty: selectedDifficulty
      };

      setPersistentData(p => {
          const newScores = [...(p.highScores || []), entry]
             .sort((a, b) => b.score - a.score)
             .slice(0, 10); // Keep top 10
          return { ...p, highScores: newScores };
      });

      setHasSubmittedScore(true);
  };

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
  const showMenusRef = useRef(showGarage || showUpgradesList || showSettings || showGuide || showCheats || showLeaderboard);

  useEffect(() => { persistentDataRef.current = persistentData; }, [persistentData]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { autoAttackRef.current = autoAttack; }, [autoAttack]);
  useEffect(() => { showMenusRef.current = showGarage || showUpgradesList || showSettings || showGuide || showCheats || showLeaderboard; }, [showGarage, showUpgradesList, showSettings, showGuide, showCheats, showLeaderboard]);

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

const handleResetProgress = () => {
    const resetData = {
        ...DEFAULT_DATA,
        settings: persistentData.settings // Keep settings but reset progress
    };
    setPersistentData(resetData);
    setGameState(GameState.START);
    setIsPaused(false);
    setShowSettings(false);
};

const aimTouchIdRef = useRef<number | null>(null);

const handleTapAimInput = useCallback((clientX: number, clientY: number) => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 0) {
    aimDirRef.current = { x: dx/dist, y: dy/dist };
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
const totalCredits = persistentData.credits + (gameState === GameState.PLAYING ? stats.credits : 0);
const bestScore = persistentData.highScores?.[0]?.score || 0;
const currentRank = persistentData.currentLevel || 1;

return (
  <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
    <canvas ref={canvasRef} className="absolute inset-0" />

    {gameState === GameState.START && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-lg z-[200]">
        <h1 className="text-cyan-400 text-7xl font-black italic uppercase mb-2 drop-shadow-[0_0_40px_rgba(6,182,212,0.9)] text-center">Void Arena</h1>
        
        {bestScore > 0 && (
            <div className="mb-8 px-4 py-1 rounded bg-slate-900/50 border border-slate-700 text-amber-400 font-bold uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                Best Score: {bestScore.toLocaleString()}
            </div>
        )}
        
        <button 
             onClick={() => setShowLeaderboard(true)}
             className="absolute top-6 right-6 w-14 h-14 bg-slate-800 rounded-full border border-slate-700 text-amber-400 shadow-xl flex items-center justify-center hover:bg-slate-700 transition-all active:scale-95 z-[210]"
        >
             <i className="fa-solid fa-trophy text-2xl" />
        </button>

        {/* Difficulty Selection */}
        <div className="flex gap-2 mb-6 p-2 bg-slate-900/60 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            {Object.values(DIFFICULTY_CONFIGS).map(diff => {
                const isUnlocked = currentRank >= diff.minRank;
                const isSelected = selectedDifficulty === diff.id;
                
                return (
                    <button 
                        key={diff.id}
                        disabled={!isUnlocked}
                        onClick={() => setSelectedDifficulty(diff.id)}
                        className={`px-4 py-3 rounded-lg flex flex-col items-center min-w-[100px] transition-all relative
                            ${isSelected ? 'bg-slate-800 border-2 shadow-lg scale-105 z-10' : 'bg-transparent border border-transparent opacity-60 hover:opacity-100'}
                            ${!isUnlocked ? 'cursor-not-allowed opacity-30 grayscale' : ''}
                        `}
                        style={{ borderColor: isSelected ? diff.color : 'transparent' }}
                    >
                        <div className="font-black text-sm uppercase tracking-widest" style={{ color: diff.color }}>{diff.name}</div>
                        {!isUnlocked && (
                            <div className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                <i className="fa-solid fa-lock" /> Rank {diff.minRank}
                            </div>
                        )}
                        {isSelected && (
                             <div className="text-[9px] font-bold text-white mt-1">{diff.description}</div>
                        )}
                    </button>
                );
            })}
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs mt-2">
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
            <button onClick={() => setShowUpgradesList(true)} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">MANIFEST</button>
          </div>

           <button onClick={() => setShowGuide(true)} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">MANUAL</button>

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

    {showLeaderboard && (
        <LeaderboardMenu 
            scores={persistentData.highScores || []}
            onClose={() => setShowLeaderboard(false)}
        />
    )}

    {showSettings && (
      <SettingsMenu 
        data={persistentData}
        onUpdate={setPersistentData}
        onReset={handleResetProgress}
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
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-2xl z-[200] p-6">
        <h2 className="text-white text-6xl font-black uppercase mb-6 italic tracking-tighter text-center">Mission Failed</h2>
        
        {!hasSubmittedScore && pendingHighScore ? (
            <div className="w-full max-w-sm bg-slate-900 border border-amber-500 rounded-2xl p-6 mb-6 flex flex-col gap-4 animate-in fade-in zoom-in">
                <div className="text-center">
                    <div className="text-amber-400 font-black text-xl uppercase tracking-widest mb-1">New High Score!</div>
                    <div className="text-white text-4xl font-black tabular-nums">{pendingHighScore.score.toLocaleString()}</div>
                    <div className="text-slate-400 text-xs font-bold uppercase mt-1">Rank #{pendingHighScore.rank}</div>
                </div>
                
                <div className="flex flex-col gap-2">
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Enter Pilot Name</label>
                    <input 
                        type="text" 
                        value={newHighScoreName}
                        onChange={(e) => setNewHighScoreName(e.target.value)}
                        maxLength={12}
                        className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold text-center uppercase focus:border-cyan-500 outline-none"
                    />
                </div>

                <button 
                    onClick={submitScore}
                    className="w-full py-4 bg-amber-500 text-slate-950 font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 active:scale-95 transition-all"
                >
                    Register Score
                </button>
            </div>
        ) : (
             <>
                <div className="flex flex-col gap-2 items-center mb-8">
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Final Score</div>
                    <div className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                        {score.toLocaleString()}
                    </div>
                </div>
                
                {/* Mini Leaderboard View */}
                <div className="w-full max-w-sm bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-8 overflow-hidden">
                    <div className="flex justify-between items-center mb-2 px-2">
                         <h3 className="text-cyan-400 font-black uppercase italic text-sm">Top Aces</h3>
                    </div>
                    <div className="flex flex-col gap-1">
                        {(persistentData.highScores || []).slice(0, 5).map((s, idx) => (
                            <div key={idx} className={`flex justify-between items-center p-2 rounded text-xs ${s.score === score && hasSubmittedScore ? 'bg-amber-400/10 border border-amber-400/30' : ''}`}>
                                <div className="flex gap-2">
                                    <span className={`font-bold w-4 ${idx === 0 ? 'text-amber-400' : 'text-slate-500'}`}>#{idx + 1}</span>
                                    <span className="text-slate-300 font-bold uppercase">{s.name}</span>
                                </div>
                                <span className="font-black text-slate-400">{s.score.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
             </>
        )}

        <div className="bg-amber-400/10 border border-amber-400/30 px-8 py-3 rounded-xl text-amber-400 font-black text-2xl mb-8 flex items-center gap-3">
          <i className="fa-solid fa-coins" />
          <span>Salvage: +{Math.floor(stats.credits)} C</span>
        </div>
        
        <button onClick={() => setGameState(GameState.START)} className="px-12 py-5 bg-white text-red-900 font-black text-2xl rounded-full shadow-2xl active:scale-95 transition-all hover:bg-slate-200">RETURN TO BASE</button>
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
          totalCredits={totalCredits}
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
