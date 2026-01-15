
import { GameState, PersistentData, ShipType, WeaponType, ControlScheme, HighScoreEntry, GameDifficulty, DebugConfig, GameMode, ModuleType } from './types';
import { DIFFICULTY_CONFIGS, DEFAULT_ZOOM } from './constants';
import Joystick from './components/Joystick';
import HUD from './components/HUD';
import UpgradeMenu from './components/UpgradeMenu';
import GarageMenu from './components/GarageMenu';
import UpgradesList from './components/UpgradesList';
import SettingsMenu from './components/SettingsMenu';
import GuideMenu from './components/GuideMenu';
import CheatsMenu from './components/CheatsMenu';
import LeaderboardMenu from './components/LeaderboardMenu';
import StatsMenu from './components/StatsMenu';
import DebugMenu from './components/DebugMenu'; // Import
import { useGameLogic } from './hooks/useGameLogic';
import { generateStars, drawBackground, BackgroundStar } from './systems/BackgroundManager';
import { renderGame } from './systems/GameRenderer';
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
  equippedModule: ModuleType.NONE,
  unlockedModules: [],
  currentLevel: 1,
  currentXp: 0,
  xpToNextLevel: 250,
  acquiredUpgradeIds: [],
  highScores: [],
  settings: {
    controlScheme: isTouchDevice() ? ControlScheme.TWIN_STICK : ControlScheme.KEYBOARD_MOUSE,
    zoomLevel: DEFAULT_ZOOM,
    autoShowLevelUp: true
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
  const [showStats, setShowStats] = useState(false);
  const [showDebugMenu, setShowDebugMenu] = useState(false); // Debug Menu State
  
  // Game Mode State (Standard vs Debug)
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.STANDARD);
  const [debugConfig, setDebugConfig] = useState<DebugConfig | null>(null);

  // Difficulty Selection State
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>(GameDifficulty.NORMAL);

  // High Score Entry State
  const [newHighScoreName, setNewHighScoreName] = useState('');
  const [pendingHighScore, setPendingHighScore] = useState<{score: number, rank: number, accuracy: number, kills: number, credits: number} | null>(null);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  
  // Initialize Persistent Data with Auto-Detection and Migration
  const [persistentData, setPersistentData] = useState<PersistentData>(() => {
    const saved = localStorage.getItem('stellar_survivor_v11_rpg');
    let data = saved ? JSON.parse(saved) : DEFAULT_DATA;

    // Ensure settings exist (Migration or New)
    if (!data.settings) {
      data.settings = {
        controlScheme: isTouchDevice() ? ControlScheme.TWIN_STICK : ControlScheme.KEYBOARD_MOUSE,
        zoomLevel: DEFAULT_ZOOM,
        autoShowLevelUp: true
      };
    } else {
      if (data.settings.zoomLevel === undefined) {
          data.settings.zoomLevel = DEFAULT_ZOOM;
      }
      if (data.settings.autoShowLevelUp === undefined) {
          data.settings.autoShowLevelUp = true;
      }
    }
    
    // Migration for Modules
    if (data.equippedModule === undefined) {
        data.equippedModule = ModuleType.NONE;
        data.unlockedModules = [];
    }

    // Migration: Convert old number[] scores to HighScoreEntry[] objects
    if (!data.highScores) {
        data.highScores = [];
    } else if (data.highScores.length > 0 && typeof data.highScores[0] === 'number') {
        data.highScores = (data.highScores as unknown as number[]).map(s => ({
            name: 'Unknown',
            score: s,
            date: Date.now(),
            difficulty: GameDifficulty.NORMAL
        }));
    }

    return data;
  });
  
  const [offeredUpgrades, setOfferedUpgrades] = useState<any[]>([]);

  const stars = useMemo<BackgroundStar[]>(() => generateStars(400), []);

  // PAUSE LOGIC: Game pauses if manually paused OR if any overlay menu is open
  const isGamePaused = isPaused || showGarage || showUpgradesList || showSettings || showGuide || showCheats || showLeaderboard || showStats || showDebugMenu;

  const {
    stats, score, playerPosRef, cameraPosRef, joystickDirRef, aimDirRef, triggerRef,
    initGame, update, setStats, addUpgrade, statsRef, lastPlayerHitTime, syncWithPersistentData,
    autoAttack, setAutoAttack,
    enemiesRef, projectilesRef, pickupsRef, particlesRef, runMetricsRef,
    triggerManualLevelUp, onUpgradeSelected, activateModule
  } = useGameLogic(
    gameState, setGameState, persistentData, setOfferedUpgrades, isGamePaused, selectedDifficulty, gameMode, debugConfig
  );

  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  useEffect(() => {
    localStorage.setItem('stellar_survivor_v11_rpg', JSON.stringify(persistentData));
  }, [persistentData]);

  // Handle Death Transition
  useEffect(() => {
    if (gameState === GameState.PLAYING && stats.currentHealth <= 0) {
      setGameState(GameState.DYING);
      
      // Trigger visual effects manually here since we are outside the loop
      particlesRef.current.push({
          id: 'PLAYER_DEATH_BOOM',
          type: 'EXPLOSION' as any,
          pos: { ...playerPosRef.current },
          vel: { x: 0, y: 0 },
          radius: 120,
          color: '#06b6d4',
          health: 1, maxHealth: 1,
          duration: 0,
          maxDuration: 2.0 // Long explosion
      });
      
      // Secondary explosions
      for(let i=0; i<5; i++) {
          setTimeout(() => {
            particlesRef.current.push({
                id: `PLAYER_DEATH_SUB_${i}`,
                type: 'EXPLOSION' as any,
                pos: { 
                    x: playerPosRef.current.x + (Math.random()-0.5)*60, 
                    y: playerPosRef.current.y + (Math.random()-0.5)*60 
                },
                vel: { x: 0, y: 0 },
                radius: 40 + Math.random() * 40,
                color: Math.random() > 0.5 ? '#fff' : '#facc15',
                health: 1, maxHealth: 1,
                duration: 0,
                maxDuration: 0.8
            });
          }, i * 200);
      }
    }
  }, [stats.currentHealth, gameState, playerPosRef, particlesRef]);

  // Handle Dying -> GameOver Transition
  useEffect(() => {
      if (gameState === GameState.DYING) {
          const timer = setTimeout(() => {
              // Calculate Final Run Stats
              const metrics = runMetricsRef.current;
              const accuracy = metrics.shotsFired > 0 
                ? Math.min(100, (metrics.shotsHit / metrics.shotsFired) * 100)
                : 0;

              // 1. Save RPG Progress (Only in Standard Mode)
              if (gameMode === GameMode.STANDARD) {
                  setPersistentData(p => ({ 
                    ...p, 
                    credits: p.credits + stats.credits,
                    currentLevel: stats.level,
                    currentXp: stats.xp,
                    xpToNextLevel: stats.xpToNextLevel,
                    acquiredUpgradeIds: stats.acquiredUpgrades.map(u => u.id)
                  }));

                  // 2. Leaderboard Logic (Only in Standard Mode)
                  const currentScores = (persistentData.highScores || [])
                      .filter(s => s.difficulty === selectedDifficulty || (!s.difficulty && selectedDifficulty === GameDifficulty.NORMAL));
                  
                  const newScore = score;
                  const sorted = [...currentScores].sort((a, b) => b.score - a.score);
                  
                  let rank = -1;
                  if (sorted.length < 10) {
                      rank = sorted.filter(s => s.score > newScore).length + 1;
                  } else {
                      if (newScore > sorted[9].score) {
                          rank = sorted.filter(s => s.score > newScore).length + 1;
                      }
                  }

                  if (rank !== -1 && newScore > 0) {
                      setPendingHighScore({ 
                          score: newScore, 
                          rank,
                          accuracy: accuracy,
                          kills: metrics.enemiesKilled,
                          credits: metrics.creditsEarned
                      });
                      setNewHighScoreName(`Pilot-${Math.floor(Math.random()*1000)}`);
                      setHasSubmittedScore(false);
                  } else {
                      setPendingHighScore(null);
                      setHasSubmittedScore(true);
                  }
              }

              setGameState(GameState.GAMEOVER);
          }, 2500); // 2.5 seconds of death animation

          return () => clearTimeout(timer);
      }
  }, [gameState, score, selectedDifficulty, stats.credits, stats.level, stats.xp, stats.xpToNextLevel, stats.acquiredUpgrades, gameMode]);

  const submitScore = () => {
      if (!pendingHighScore) return;
      
      const entry: HighScoreEntry = {
          name: newHighScoreName.substring(0, 12).toUpperCase() || 'UNKNOWN',
          score: pendingHighScore.score,
          date: Date.now(),
          ship: stats.shipType,
          difficulty: selectedDifficulty,
          accuracy: pendingHighScore.accuracy,
          enemiesKilled: pendingHighScore.kills,
          creditsEarned: pendingHighScore.credits
      };

      setPersistentData(p => {
          const newScores = [...(p.highScores || []), entry]
             .sort((a, b) => b.score - a.score); 
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

  // --- REFS FOR GAME LOOP ---
  const persistentDataRef = useRef(persistentData);
  const isPausedRef = useRef(isPaused);
  const gameStateRef = useRef(gameState);
  const autoAttackRef = useRef(autoAttack);
  const showMenusRef = useRef(isGamePaused);

  useEffect(() => { persistentDataRef.current = persistentData; }, [persistentData]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { autoAttackRef.current = autoAttack; }, [autoAttack]);
  useEffect(() => { showMenusRef.current = isGamePaused; }, [isGamePaused]);

  const frame = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.max(0, Math.min(0.05, (time - lastTimeRef.current) / 1000));
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentScheme = persistentDataRef.current.settings.controlScheme;
    const currentZoom = persistentDataRef.current.settings.zoomLevel || DEFAULT_ZOOM;

    const isPausedNow = isPausedRef.current || showMenusRef.current;
    const currentState = gameStateRef.current;
    const isAutoAttack = autoAttackRef.current;

    // --- KEYBOARD/MOUSE INPUT LOGIC ---
    if (currentScheme === ControlScheme.KEYBOARD_MOUSE && !isPausedNow && currentState === GameState.PLAYING) {
        let dx = 0; let dy = 0;
        if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) dy -= 1;
        if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) dy += 1;
        if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) dx -= 1;
        if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) dx += 1;
        
        // Also map Spacebar and '1' to Module Activation
        if (keysPressed.current.has('Space') || keysPressed.current.has('Digit1')) {
            activateModule();
        }
        
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) {
            joystickDirRef.current = { x: dx/len, y: dy/len };
        } else {
            joystickDirRef.current = { x: 0, y: 0 };
        }

        const screenCX = window.innerWidth / 2;
        const screenCY = window.innerHeight / 2;
        
        const relX = (playerPosRef.current.x - cameraPosRef.current.x);
        const relY = (playerPosRef.current.y - cameraPosRef.current.y);
        
        const playerScreenX = screenCX + relX * currentZoom;
        const playerScreenY = screenCY + relY * currentZoom;

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

    try {
        updateRef.current(time, dt);
    } catch (e) {
        console.error("Game Loop Error:", e);
    }

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
      lastPlayerHitTime.current,
      currentZoom,
      currentState
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
  if (gameMode === GameMode.STANDARD) {
      setPersistentData(p => ({ 
        ...p, 
        credits: p.credits + stats.credits,
        currentLevel: stats.level,
        currentXp: stats.xp,
        xpToNextLevel: stats.xpToNextLevel,
        acquiredUpgradeIds: stats.acquiredUpgrades.map(u => u.id)
      }));
  }
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

const handleStartStandard = () => {
    setGameMode(GameMode.STANDARD);
    setDebugConfig(null);
    initGame();
};

const handleStartSimulation = (config: DebugConfig) => {
    setGameMode(GameMode.DEBUG);
    setDebugConfig(config);
    setShowDebugMenu(false);
    initGame();
};

// ... Aim handlers ...
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
        <h1 className="text-cyan-400 text-5xl font-black italic uppercase mb-2 drop-shadow-[0_0_40px_rgba(6,182,212,0.9)] text-center">Void Arena</h1>
        
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
          <button onClick={handleStartStandard} className="py-6 bg-cyan-500 text-slate-950 font-black text-2xl rounded-2xl active:scale-95 transition-all shadow-lg shadow-cyan-500/20">START MISSION</button>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setShowGarage(true)} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95 transition-all">GARAGE</button>
            <button onClick={() => setShowDebugMenu(true)} className="py-4 bg-slate-900 text-emerald-400 font-black text-xl rounded-2xl border border-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-inner hover:bg-slate-800">
               <i className="fa-solid fa-flask" /> SIM
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => setShowSettings(true)} className="py-3 bg-slate-900 text-slate-400 font-bold text-sm rounded-xl border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-gear" /> SETTINGS
              </button>
              <button onClick={() => setShowGuide(true)} className="py-3 bg-slate-900 text-slate-400 font-bold text-sm rounded-xl border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-book" /> MANUAL
              </button>
          </div>
          
          <button onClick={() => setShowCheats(true)} className="py-2 bg-transparent text-red-900/50 font-bold text-xs uppercase tracking-widest hover:text-red-500 hover:bg-slate-900 rounded-lg transition-all">
             <i className="fa-solid fa-code mr-2" />
             Access Cheats
          </button>
        </div>

        <div className="mt-12 text-amber-400 font-black text-xl flex items-center gap-2">
          <i className="fas fa-coins" />
          <span>{persistentData.credits.toLocaleString()} CREDITS</span>
        </div>
        <div className="mt-2 text-cyan-400/60 font-bold text-sm uppercase tracking-widest">
           RANK: LV {persistentData.currentLevel || 1}
        </div>

        <div className="absolute bottom-6 text-slate-600 font-bold text-xs tracking-widest opacity-50">
          v0.2.0
        </div>
      </div>
    )}

    {isPaused && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-2xl z-[250]">
        <h2 className="text-white text-5xl font-black italic uppercase mb-12">Paused</h2>
        <div className="flex flex-col gap-4 w-full max-w-xs px-6">
          <button onClick={() => setIsPaused(false)} className="py-6 bg-cyan-500 text-slate-950 font-black text-2xl rounded-2xl active:scale-95 shadow-xl">RESUME</button>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { setShowGarage(true); setIsPaused(false); }} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">GARAGE</button>
            <button onClick={() => setShowStats(true)} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">STATUS</button>
          </div>

           <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowUpgradesList(true)} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">MANIFEST</button>
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

    {/* Leaderboard, Settings, Guide, Cheats, Garage, Upgrade Menu */}
    {showDebugMenu && (
        <DebugMenu onStart={handleStartSimulation} onClose={() => setShowDebugMenu(false)} />
    )}
    {showLeaderboard && (
        <LeaderboardMenu scores={persistentData.highScores || []} onClose={() => setShowLeaderboard(false)} />
    )}
    {showSettings && (
      <SettingsMenu data={persistentData} onUpdate={setPersistentData} onReset={handleResetProgress} onClose={() => setShowSettings(false)} />
    )}
    {showGuide && (
      <GuideMenu onClose={() => setShowGuide(false)} />
    )}
    {showCheats && (
      <CheatsMenu data={persistentData} onUpdate={setPersistentData} onClose={() => setShowCheats(false)} />
    )}
    {showGarage && (
      <GarageMenu data={persistentData} sessionCredits={gameState === GameState.PLAYING ? stats.credits : 0} onUpdate={handleGarageUpdate} onApplyEffect={setStats} onClose={() => setShowGarage(false)} />
    )}
    {showUpgradesList && (
      <UpgradesList acquired={stats.acquiredUpgrades} onClose={() => setShowUpgradesList(false)} />
    )}
    {showStats && (
        <StatsMenu stats={stats} onClose={() => setShowStats(false)} />
    )}

    {/* GAMEOVER SCREEN with Combat Log */}
    {gameState === GameState.GAMEOVER && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-2xl z-[200] p-6 animate-in fade-in duration-500">
        <h2 className="text-white text-5xl font-black uppercase mb-6 italic tracking-tighter text-center">Mission Failed</h2>
        
        <div className="flex gap-8 w-full max-w-4xl justify-center items-start">
            
            {/* Left Col: High Score / Score */}
            <div className="flex-1 flex flex-col items-center max-w-md">
                {!hasSubmittedScore && pendingHighScore && gameMode === GameMode.STANDARD ? (
                    <div className="w-full bg-slate-900 border border-amber-500 rounded-2xl p-6 mb-6 flex flex-col gap-4">
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

                        <button onClick={submitScore} className="w-full py-4 bg-amber-500 text-slate-950 font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 active:scale-95 transition-all">
                            Register Score
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center mb-8">
                        {gameMode === GameMode.DEBUG && (
                            <div className="mb-4 px-4 py-1 bg-emerald-900/50 border border-emerald-500/50 rounded text-emerald-400 font-bold uppercase tracking-widest text-xs">
                                Simulation Mode
                            </div>
                        )}
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total Score</div>
                        <div className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                            {score.toLocaleString()}
                        </div>
                    </div>
                )}
                
                {/* Run Stats */}
                 <div className="w-full grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                         <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Accuracy</div>
                         <div className="text-cyan-400 font-black text-lg">{(runMetricsRef.current.shotsFired > 0 ? (runMetricsRef.current.shotsHit / runMetricsRef.current.shotsFired * 100) : 0).toFixed(1)}%</div>
                    </div>
                     <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                         <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Enemies Killed</div>
                         <div className="text-red-500 font-black text-lg">{runMetricsRef.current.enemiesKilled.toLocaleString()}</div>
                    </div>
                 </div>

                 {gameMode === GameMode.STANDARD && (
                    <div className="bg-amber-400/10 border border-amber-400/30 px-8 py-3 rounded-xl text-amber-400 font-black text-xl mb-8 flex items-center gap-3 w-full justify-center">
                        <i className="fa-solid fa-coins" />
                        <span>Salvage: +{Math.floor(stats.credits)} C</span>
                    </div>
                 )}

                 <button onClick={() => setGameState(GameState.START)} className="w-full py-5 bg-white text-red-900 font-black text-2xl rounded-full shadow-2xl active:scale-95 transition-all hover:bg-slate-200">RETURN TO BASE</button>
            </div>

            {/* Right Col: Combat Log */}
            <div className="w-full max-w-xs bg-slate-900/50 border border-red-900/30 rounded-2xl p-4 flex flex-col gap-2 overflow-hidden">
                <div className="flex items-center gap-2 mb-2 text-red-500 border-b border-red-900/30 pb-2">
                     <i className="fa-solid fa-triangle-exclamation" />
                     <span className="font-black uppercase text-sm tracking-widest">System Failure Log</span>
                </div>
                
                {stats.combatLog.length === 0 ? (
                    <div className="text-slate-500 text-xs italic text-center py-4">No damage recorded.</div>
                ) : (
                    stats.combatLog.slice().reverse().map((entry, idx) => (
                        <div key={idx} className={`p-2 rounded flex justify-between items-center text-xs ${entry.isFatal ? 'bg-red-500/20 border border-red-500' : 'bg-slate-950/50 border border-slate-800'}`}>
                            <div>
                                <div className="font-bold text-slate-300">{entry.source} {entry.enemyLevel ? `(LV ${entry.enemyLevel})` : ''}</div>
                                {entry.isFatal && <div className="text-[9px] text-red-400 font-black uppercase tracking-wider">CRITICAL FAILURE</div>}
                            </div>
                            <div className="font-black text-red-400">-{entry.damage} HP</div>
                        </div>
                    ))
                )}
            </div>

        </div>
      </div>
    )}

    {(gameState === GameState.PLAYING || gameState === GameState.LEVELING || gameState === GameState.DYING) && !isGamePaused && (
      <>
        {currentScheme === ControlScheme.TAP_TO_AIM && (
          <div 
             className="absolute inset-0 z-30 touch-none cursor-crosshair"
             onTouchStart={handleAimLayerTouchStart}
             onTouchMove={handleAimLayerTouchMove}
             onTouchEnd={handleAimLayerTouchEnd}
             onMouseDown={handleAimLayerMouseDown}
             onMouseMove={handleAimLayerMouseDown}
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

        {/* Hide HUD when Dying */}
        {gameState !== GameState.DYING && (
            <HUD
            stats={stats}
            score={score}
            autoAttack={autoAttack}
            setAutoAttack={setAutoAttack}
            totalCredits={totalCredits}
            onPause={() => setIsPaused(true)}
            onShowUpgrades={() => setShowUpgradesList(true)}
            onOpenGarage={() => setShowGarage(true)}
            onLevelClick={triggerManualLevelUp}
            onActivateModule={activateModule}
            />
        )}
        
        {/* Render Upgrade Menu AFTER HUD/Controls to ensure it overlays them visually and receives input */}
        {gameState === GameState.LEVELING && (
          <UpgradeMenu 
            upgrades={offeredUpgrades} 
            onSelect={(u) => { 
                onUpgradeSelected(u);
            }} 
          />
        )}
      </>
    )}
  </div>
);
};

export default App;
