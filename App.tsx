import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { GameState, PersistentData, ControlScheme, HighScoreEntry, GameDifficulty, DebugConfig, GameMode, ModuleType, DEFAULT_PERSISTENT_DATA } from './types';
import { DIFFICULTY_CONFIGS, DEFAULT_ZOOM } from './constants';

// UI Components
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
import DebugMenu from './components/DebugMenu';

// Screen Components
import StartScreen from './screens/StartScreen';
import PauseOverlay from './screens/PauseOverlay';
import GameOverScreen from './screens/GameOverScreen';

// Core Systems
import { useGameLogic } from './hooks/useGameLogic';
import { generateStars, drawBackground, BackgroundStar } from './core/systems/BackgroundManager';
import { renderGame } from './core/systems/GameRenderer';
import { inputManager } from './core/systems/input';

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const App: React.FC = () => {
  // --- CORE GAME STATE ---
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isPaused, setIsPaused] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.STANDARD);
  const [debugConfig, setDebugConfig] = useState<DebugConfig | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>(GameDifficulty.NORMAL);

  // --- OVERLAY VISIBILITY ---
  const [showGarage, setShowGarage] = useState(false);
  const [showUpgradesList, setShowUpgradesList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showCheats, setShowCheats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDebugMenu, setShowDebugMenu] = useState(false);

  // --- HIGH SCORE STATE ---
  const [newHighScoreName, setNewHighScoreName] = useState('');
  const [pendingHighScore, setPendingHighScore] = useState<{ score: number; rank: number; accuracy: number; kills: number; credits: number; survivalTime: number } | null>(null);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

  // --- PERSISTENT DATA ---
  const [persistentData, setPersistentData] = useState<PersistentData>(() => {
    const saved = localStorage.getItem('void-arena-data');
    let data = saved ? JSON.parse(saved) : DEFAULT_PERSISTENT_DATA;
    if (!data.settings) {
      data.settings = { controlScheme: isTouchDevice() ? ControlScheme.TWIN_STICK : ControlScheme.KEYBOARD_MOUSE, zoomLevel: DEFAULT_ZOOM, autoShowLevelUp: true };
    }
    if (data.equippedModule === undefined) { data.equippedModule = ModuleType.NONE; data.unlockedModules = []; }
    if (!data.highScores) data.highScores = [];
    return data;
  });

  const [offeredUpgrades, setOfferedUpgrades] = useState<any[]>([]);
  const stars = useMemo<BackgroundStar[]>(() => generateStars(400), []);
  const isGamePaused = isPaused || showGarage || showUpgradesList || showSettings || showGuide || showCheats || showLeaderboard || showStats || showDebugMenu;

  // --- GAME LOGIC HOOK ---
  const {
    stats, score, playerPosRef, cameraPosRef,
    initGame, update, setStats, statsRef, lastPlayerHitTime, syncWithPersistentData,
    autoAttack, setAutoAttack, enemiesRef, projectilesRef, pickupsRef, particlesRef, runMetricsRef,
    triggerManualLevelUp, onUpgradeSelected, activateModule, gameTime
  } = useGameLogic(gameState, setGameState, persistentData, setOfferedUpgrades, isGamePaused, selectedDifficulty, gameMode, debugConfig);

  const updateRef = useRef(update);
  useEffect(() => { updateRef.current = update; }, [update]);
  useEffect(() => { localStorage.setItem('void-arena-data', JSON.stringify(persistentData)); }, [persistentData]);

  // --- DEATH TRANSITIONS ---
  useEffect(() => {
    if (gameState === GameState.PLAYING && stats.currentHealth <= 0) {
      setGameState(GameState.DYING);
      particlesRef.current.push({ id: 'PLAYER_DEATH_BOOM', type: 'EXPLOSION' as any, pos: { ...playerPosRef.current }, vel: { x: 0, y: 0 }, radius: 120, color: '#06b6d4', health: 1, maxHealth: 1, duration: 0, maxDuration: 2.0 });
      for (let i = 0; i < 5; i++) { setTimeout(() => { particlesRef.current.push({ id: `PLAYER_DEATH_SUB_${i}`, type: 'EXPLOSION' as any, pos: { x: playerPosRef.current.x + (Math.random() - 0.5) * 60, y: playerPosRef.current.y + (Math.random() - 0.5) * 60 }, vel: { x: 0, y: 0 }, radius: 40 + Math.random() * 40, color: Math.random() > 0.5 ? '#fff' : '#facc15', health: 1, maxHealth: 1, duration: 0, maxDuration: 0.8 }); }, i * 200); }
    }
  }, [stats.currentHealth, gameState, playerPosRef, particlesRef]);

  useEffect(() => {
    if (gameState === GameState.DYING) {
      const timer = setTimeout(() => {
        const metrics = runMetricsRef.current;
        const accuracy = metrics.shotsFired > 0 ? Math.min(100, (metrics.shotsHit / metrics.shotsFired) * 100) : 0;
        if (gameMode === GameMode.STANDARD) {
          setPersistentData(p => ({ ...p, credits: p.credits + stats.credits, currentLevel: stats.level, currentXp: stats.xp, xpToNextLevel: stats.xpToNextLevel, acquiredUpgradeIds: stats.acquiredUpgrades.map(u => u.id) }));
          const currentScores = (persistentData.highScores || []).filter(s => s.difficulty === selectedDifficulty || (!s.difficulty && selectedDifficulty === GameDifficulty.NORMAL));
          const sorted = [...currentScores].sort((a, b) => b.score - a.score);
          let rank = sorted.length < 10 ? sorted.filter(s => s.score > score).length + 1 : (score > sorted[9]?.score ? sorted.filter(s => s.score > score).length + 1 : -1);
          if (rank !== -1 && score > 0) { setPendingHighScore({ score, rank, accuracy, kills: metrics.enemiesKilled, credits: metrics.creditsEarned, survivalTime: gameTime }); setNewHighScoreName(`Pilot-${Math.floor(Math.random() * 1000)}`); setHasSubmittedScore(false); }
          else { setPendingHighScore(null); setHasSubmittedScore(true); }
        }
        setGameState(GameState.GAMEOVER);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [gameState, score, selectedDifficulty, stats, gameMode, gameTime, persistentData.highScores, runMetricsRef]);

  const submitScore = () => {
    if (!pendingHighScore) return;
    const entry: HighScoreEntry = { name: newHighScoreName.substring(0, 12).toUpperCase() || 'UNKNOWN', score: pendingHighScore.score, date: Date.now(), ship: stats.shipType, difficulty: selectedDifficulty, accuracy: pendingHighScore.accuracy, enemiesKilled: pendingHighScore.kills, creditsEarned: pendingHighScore.credits, survivalTime: pendingHighScore.survivalTime };
    setPersistentData(p => ({ ...p, highScores: [...(p.highScores || []), entry].sort((a, b) => b.score - a.score) }));
    setHasSubmittedScore(true);
  };

  // --- CANVAS & ANIMATION LOOP ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isMouseDown = useRef(false);

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

  const frame = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.max(0, Math.min(0.05, (time - lastTimeRef.current) / 1000));
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    if (!canvas) { requestRef.current = requestAnimationFrame(frame); return; }
    if (canvas.width !== window.innerWidth) canvas.width = window.innerWidth;
    if (canvas.height !== window.innerHeight) canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) { requestRef.current = requestAnimationFrame(frame); return; }

    const currentScheme = persistentDataRef.current.settings?.controlScheme || ControlScheme.KEYBOARD_MOUSE;
    const currentZoom = persistentDataRef.current.settings?.zoomLevel || DEFAULT_ZOOM;
    const isPausedNow = isPausedRef.current || showMenusRef.current;
    const currentState = gameStateRef.current;
    const isAutoAttack = autoAttackRef.current;

    if (currentScheme === ControlScheme.KEYBOARD_MOUSE && !isPausedNow && currentState === GameState.PLAYING) {
      let dx = 0, dy = 0;
      if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) dy -= 1;
      if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) dy += 1;
      if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) dx -= 1;
      if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) dx += 1;
      if (keysPressed.current.has('Space') || keysPressed.current.has('Digit1')) activateModule();
      const len = Math.sqrt(dx * dx + dy * dy);
      inputManager.setMovement(len > 0 ? { x: dx / len, y: dy / len } : { x: 0, y: 0 });

      const screenCX = window.innerWidth / 2, screenCY = window.innerHeight / 2;
      const playerScreenX = screenCX + (playerPosRef.current.x - cameraPosRef.current.x) * currentZoom;
      const playerScreenY = screenCY + (playerPosRef.current.y - cameraPosRef.current.y) * currentZoom;
      const vx = mousePos.current.x - playerScreenX, vy = mousePos.current.y - playerScreenY;
      const dist = Math.sqrt(vx * vx + vy * vy);
      if (dist > 0) inputManager.setAim({ x: vx / dist, y: vy / dist });
      inputManager.setFire(isMouseDown.current || isAutoAttack);
    } else if ((currentScheme === ControlScheme.TWIN_STICK || currentScheme === ControlScheme.TAP_TO_AIM) && !isPausedNow) {
      inputManager.setFire(true);
    }

    try { updateRef.current(time, dt); } catch (e) { console.error("Game Loop Error:", e); }

    ctx.fillStyle = '#0a0a10'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, canvas.width, canvas.height, canvas.width / 2 - cameraPosRef.current.x, canvas.height / 2 - cameraPosRef.current.y, stars);
    renderGame(ctx, canvas, enemiesRef.current, projectilesRef.current, pickupsRef.current, particlesRef.current, playerPosRef.current, cameraPosRef.current, statsRef.current, inputManager.getMovement(), inputManager.getAim(), time, lastPlayerHitTime.current, currentZoom, currentState);

    requestRef.current = requestAnimationFrame(frame);
  }, [stars, activateModule]);

  useEffect(() => {
    const handleResize = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } };
    window.addEventListener('resize', handleResize); handleResize();
    const onKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.code);
    const onKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.code);
    const onMouseMove = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    const onMouseDown = () => { isMouseDown.current = true; };
    const onMouseUp = () => { isMouseDown.current = false; };
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove); window.addEventListener('mousedown', onMouseDown); window.addEventListener('mouseup', onMouseUp);
    lastTimeRef.current = performance.now(); requestRef.current = requestAnimationFrame(frame);
    return () => { window.removeEventListener('resize', handleResize); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mouseup', onMouseUp); if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [frame]);

  // --- EVENT HANDLERS ---
  const handleGarageUpdate = (newData: PersistentData, spentSession: number) => { if (spentSession > 0) setStats(prev => ({ ...prev, credits: Math.max(0, prev.credits - spentSession) })); setPersistentData(newData); if (gameState === GameState.PLAYING || gameState === GameState.LEVELING) syncWithPersistentData(newData); };
  const handleManualAbort = () => { if (gameMode === GameMode.STANDARD) setPersistentData(p => ({ ...p, credits: p.credits + stats.credits, currentLevel: stats.level, currentXp: stats.xp, xpToNextLevel: stats.xpToNextLevel, acquiredUpgradeIds: stats.acquiredUpgrades.map(u => u.id) })); setGameState(GameState.START); setIsPaused(false); };
  const handleResetProgress = () => { setPersistentData({ ...DEFAULT_PERSISTENT_DATA, settings: persistentData.settings }); setGameState(GameState.START); setIsPaused(false); setShowSettings(false); };
  const handleStartStandard = () => { setGameMode(GameMode.STANDARD); setDebugConfig(null); initGame(GameMode.STANDARD); };
  const handleStartSimulation = (config: DebugConfig) => { setGameMode(GameMode.DEBUG); setDebugConfig(config); setShowDebugMenu(false); initGame(GameMode.DEBUG); };

  // --- TOUCH AIM HANDLERS ---
  const aimTouchIdRef = useRef<number | null>(null);
  const handleTapAimInput = useCallback((clientX: number, clientY: number) => { const dx = clientX - window.innerWidth / 2, dy = clientY - window.innerHeight / 2; const dist = Math.sqrt(dx * dx + dy * dy); if (dist > 0) inputManager.setAim({ x: dx / dist, y: dy / dist }); }, []);
  const handleAimLayerTouchStart = useCallback((e: React.TouchEvent) => { if (persistentData.settings?.controlScheme === ControlScheme.TWIN_STICK) return; aimTouchIdRef.current = e.changedTouches[0].identifier; handleTapAimInput(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }, [persistentData.settings, handleTapAimInput]);
  const handleAimLayerTouchMove = useCallback((e: React.TouchEvent) => { if (persistentData.settings?.controlScheme === ControlScheme.TWIN_STICK) return; for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === aimTouchIdRef.current) { handleTapAimInput(e.changedTouches[i].clientX, e.changedTouches[i].clientY); break; } }, [persistentData.settings, handleTapAimInput]);
  const handleAimLayerTouchEnd = useCallback((e: React.TouchEvent) => { if (persistentData.settings?.controlScheme === ControlScheme.TWIN_STICK) return; for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === aimTouchIdRef.current) { aimTouchIdRef.current = null; inputManager.setAim({ x: 0, y: 0 }); break; } }, [persistentData.settings]);
  const handleAimLayerMouseDown = useCallback((e: React.MouseEvent) => { if (persistentData.settings?.controlScheme !== ControlScheme.TAP_TO_AIM) return; aimTouchIdRef.current = 999; handleTapAimInput(e.clientX, e.clientY); }, [persistentData.settings, handleTapAimInput]);
  const handleAimLayerMouseMove = useCallback((e: React.MouseEvent) => { if (persistentData.settings?.controlScheme !== ControlScheme.TAP_TO_AIM) return; if (aimTouchIdRef.current === 999) handleTapAimInput(e.clientX, e.clientY); }, [persistentData.settings, handleTapAimInput]);
  const handleAimLayerMouseUp = useCallback(() => { if (persistentData.settings?.controlScheme !== ControlScheme.TAP_TO_AIM) return; if (aimTouchIdRef.current === 999) { aimTouchIdRef.current = null; inputManager.setAim({ x: 0, y: 0 }); } }, [persistentData.settings]);

  const currentScheme = persistentData.settings?.controlScheme || ControlScheme.TWIN_STICK;
  const totalCredits = persistentData.credits + (gameState === GameState.PLAYING ? stats.credits : 0);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 font-sans select-none touch-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* START SCREEN */}
      {gameState === GameState.START && (
        <StartScreen
          bestScore={persistentData.highScores?.[0]?.score || 0}
          credits={persistentData.credits}
          currentRank={persistentData.currentLevel || 1}
          selectedDifficulty={selectedDifficulty}
          onSelectDifficulty={setSelectedDifficulty}
          onStartMission={handleStartStandard}
          onOpenGarage={() => setShowGarage(true)}
          onOpenDebug={() => setShowDebugMenu(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenGuide={() => setShowGuide(true)}
          onOpenCheats={() => setShowCheats(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* PAUSE OVERLAY */}
      {isPaused && (
        <PauseOverlay
          onResume={() => setIsPaused(false)}
          onOpenGarage={() => { setShowGarage(true); setIsPaused(false); }}
          onOpenStats={() => setShowStats(true)}
          onOpenManifest={() => setShowUpgradesList(true)}
          onOpenGuide={() => setShowGuide(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenCheats={() => setShowCheats(true)}
          onSaveAndExit={handleManualAbort}
        />
      )}

      {/* MODAL OVERLAYS */}
      {showDebugMenu && <DebugMenu onStart={handleStartSimulation} onClose={() => setShowDebugMenu(false)} />}
      {showLeaderboard && <LeaderboardMenu scores={persistentData.highScores || []} onClose={() => setShowLeaderboard(false)} />}
      {showSettings && <SettingsMenu data={persistentData} onUpdate={setPersistentData} onReset={handleResetProgress} onClose={() => setShowSettings(false)} />}
      {showGuide && <GuideMenu onClose={() => setShowGuide(false)} />}
      {showCheats && <CheatsMenu data={persistentData} onUpdate={setPersistentData} onClose={() => setShowCheats(false)} />}
      {showGarage && <GarageMenu data={persistentData} sessionCredits={gameState === GameState.PLAYING ? stats.credits : 0} onUpdate={handleGarageUpdate} onApplyEffect={setStats} onClose={() => setShowGarage(false)} />}
      {showUpgradesList && <UpgradesList acquired={stats.acquiredUpgrades} onClose={() => setShowUpgradesList(false)} />}
      {showStats && <StatsMenu stats={stats} onClose={() => setShowStats(false)} />}

      {/* GAME OVER SCREEN */}
      {gameState === GameState.GAMEOVER && (
        <GameOverScreen
          score={score}
          gameMode={gameMode}
          pendingHighScore={pendingHighScore}
          hasSubmittedScore={hasSubmittedScore}
          newHighScoreName={newHighScoreName}
          onNameChange={setNewHighScoreName}
          onSubmitScore={submitScore}
          runMetrics={runMetricsRef.current}
          gameTime={gameTime}
          stats={stats}
          onReturnToBase={() => setGameState(GameState.START)}
        />
      )}

      {/* IN-GAME UI */}
      {(gameState === GameState.PLAYING || gameState === GameState.LEVELING || gameState === GameState.DYING) && !isGamePaused && (
        <>
          {currentScheme === ControlScheme.TAP_TO_AIM && <div className="absolute inset-0 z-30 touch-none cursor-crosshair" onTouchStart={handleAimLayerTouchStart} onTouchMove={handleAimLayerTouchMove} onTouchEnd={handleAimLayerTouchEnd} onMouseDown={handleAimLayerMouseDown} onMouseMove={handleAimLayerMouseMove} onMouseUp={handleAimLayerMouseUp} />}
          {currentScheme === ControlScheme.TWIN_STICK && <Joystick className="absolute left-0 bottom-0 w-1/2 h-[60%] z-40" onMove={(dir) => { inputManager.setAim(dir); }} />}
          {(currentScheme === ControlScheme.TWIN_STICK || currentScheme === ControlScheme.TAP_TO_AIM) && <Joystick className="absolute right-0 bottom-0 w-1/2 h-[60%] z-40" onMove={(dir) => { inputManager.setMovement(dir); }} />}
          {gameState !== GameState.DYING && <HUD stats={stats} score={score} autoAttack={autoAttack} setAutoAttack={setAutoAttack} totalCredits={totalCredits} onPause={() => setIsPaused(true)} onShowUpgrades={() => setShowUpgradesList(true)} onOpenGarage={() => setShowGarage(true)} onLevelClick={triggerManualLevelUp} onActivateModule={activateModule} />}
          {gameState === GameState.LEVELING && <UpgradeMenu upgrades={offeredUpgrades} onSelect={onUpgradeSelected} />}
        </>
      )}
    </div>
  );
};

export default App;
