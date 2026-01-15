
import { useRef, useCallback, useState, useEffect } from 'react';
import {
  GameState, PlayerStats, PersistentData, GameDifficulty
} from '../types';
import { INITIAL_STATS, WORLD_SIZE, DIFFICULTY_CONFIGS, UPGRADES } from '../constants';
import { usePlayer } from './game/usePlayer';
import { useEnemies } from './game/useEnemies';
import { useProjectiles } from './game/useProjectiles';
import { usePickups } from './game/usePickups';
import { useParticles } from './game/useParticles';
import { useCollision } from './game/useCollision';
import { isBuffActive } from '../systems/PowerUpSystem';

export const useGameLogic = (
  gameState: GameState,
  setGameState: (s: GameState) => void,
  persistentData: PersistentData,
  setOfferedUpgrades: (u: any[]) => void,
  isPaused: boolean,
  selectedDifficulty: GameDifficulty
) => {
  const [score, setScore] = useState(0);
  const gameTimeRef = useRef(0);
  
  // RUN STATS
  const runMetricsRef = useRef({
      shotsFired: 0,
      shotsHit: 0,
      enemiesKilled: 0,
      creditsEarned: 0
  });
  
  const difficultyConfig = DIFFICULTY_CONFIGS[selectedDifficulty];

  // New: Aim Direction Ref for left joystick / mouse
  const aimDirRef = useRef({ x: 0, y: 0 });
  // New: Trigger Ref (Is player pressing fire button?)
  const triggerRef = useRef(false);

  const {
    stats, setStats, statsRef, playerPosRef, cameraPosRef, joystickDirRef,
    lastPlayerHitTimeRef, initPlayer, updatePlayer, handleShieldRegen,
    addUpgrade, triggerPlayerHit, syncWithPersistentData
  } = usePlayer(gameState, persistentData, isPaused);

  const { particlesRef, initParticles, spawnDamageText, spawnExplosion, spawnSpawnFlash, updateParticles, addParticles } = useParticles();

  const { enemiesRef, initEnemies, updateEnemies } = useEnemies(playerPosRef, difficultyConfig, spawnSpawnFlash);
  
  const handleShotFired = useCallback(() => {
      runMetricsRef.current.shotsFired++;
  }, []);
  
  const { projectilesRef, autoAttack, setAutoAttack, initProjectiles, fireWeapon, updateProjectiles, addProjectiles } = useProjectiles(playerPosRef, statsRef, handleShotFired);
  const { pickupsRef, initPickups, spawnDrops, updatePickups } = usePickups(playerPosRef, statsRef, difficultyConfig);

  const handleEnemyHit = useCallback(() => {
      runMetricsRef.current.shotsHit++;
  }, []);

  const handleEnemyKilled = useCallback(() => {
      runMetricsRef.current.enemiesKilled++;
  }, []);

  const handleCreditCollected = useCallback((amount: number) => {
      runMetricsRef.current.creditsEarned += amount;
  }, []);

  const { checkCollisions } = useCollision(
    enemiesRef, projectilesRef, pickupsRef, playerPosRef, statsRef,
    triggerPlayerHit, spawnDrops, spawnDamageText, spawnExplosion, addParticles,
    setScore, setStats, setOfferedUpgrades, persistentData,
    handleEnemyHit, handleEnemyKilled, handleCreditCollected
  );

  // Manual Level Up Trigger (for HUD)
  const triggerManualLevelUp = useCallback(() => {
      if (statsRef.current.pendingLevelUps > 0) {
          setGameState(GameState.LEVELING);
      }
  }, [setGameState]);

  // AUTO LEVEL UP TRIGGER
  // Watches for changes in pendingLevelUps. If > 0 and auto-show is enabled, trigger state change.
  useEffect(() => {
    const autoShow = persistentData.settings.autoShowLevelUp ?? true;
    if (gameState === GameState.PLAYING && stats.pendingLevelUps > 0 && autoShow) {
        setGameState(GameState.LEVELING);
    }
  }, [stats.pendingLevelUps, gameState, persistentData.settings.autoShowLevelUp, setGameState]);


  // Effect to manage Upgrade Generation loop
  const [hasGeneratedOffers, setHasGeneratedOffers] = useState(false);

  useEffect(() => {
      if (gameState === GameState.LEVELING) {
          const currentPending = stats.pendingLevelUps;
          
          if (currentPending > 0 && !hasGeneratedOffers) {
              // Generate Upgrades
              const pool = UPGRADES.filter(u => !stats.acquiredUpgrades.some(owned => owned.id === u.id) || u.id === 'health_pack');
              const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
              setOfferedUpgrades(shuffled);
              setHasGeneratedOffers(true);
          }
          // Note: We REMOVED the auto-close 'else if' block here.
          // Closing is now handled explicitly by user interaction in onUpgradeSelected
          // to prevent race conditions causing the menu to slam shut instantly.
      } else {
          setHasGeneratedOffers(false);
      }
  }, [gameState, hasGeneratedOffers, stats.pendingLevelUps, stats.acquiredUpgrades, setGameState, setOfferedUpgrades]);

  // When user selects an upgrade (in App.tsx), they call addUpgrade then clear offers.
  // We need to reset the generation flag when offers are cleared to allow next batch.
  const onUpgradeSelected = useCallback(() => {
      // Determine if we should close the menu or generate next batch
      // statsRef.current still holds the 'before decrement' value because state update is async.
      // So if we had 1 level, after this selection we have 0.
      const levelsRemaining = statsRef.current.pendingLevelUps - 1;
      
      if (levelsRemaining <= 0) {
          setGameState(GameState.PLAYING);
      }
      
      setHasGeneratedOffers(false);
  }, [setGameState]);


  // Initialize Game
  const initGame = useCallback(() => {
    initPlayer();
    initEnemies();
    initProjectiles();
    initPickups();
    initParticles();
    setScore(0);
    gameTimeRef.current = 0;
    // Reset Run Metrics
    runMetricsRef.current = { shotsFired: 0, shotsHit: 0, enemiesKilled: 0, creditsEarned: 0 };
    setGameState(GameState.PLAYING);
  }, [initPlayer, initEnemies, initProjectiles, initPickups, initParticles, setGameState]);

  // Main Update Loop
  const update = useCallback((time: number, dt: number) => {
    if (gameState !== GameState.PLAYING || isPaused) return;
    gameTimeRef.current += dt;

    // 1. Update Player
    updatePlayer(dt, time);
    handleShieldRegen(dt, time);

    // 2. Firing Logic
    const isOverdrive = isBuffActive(statsRef.current, 'OVERDRIVE', time);
    const isOmni = isBuffActive(statsRef.current, 'OMNI', time);
    const isPierce = isBuffActive(statsRef.current, 'PIERCE', time);

    // Pass aimDirRef and triggerRef to fireWeapon
    fireWeapon(time, isOverdrive, isOmni, isPierce, enemiesRef.current, aimDirRef.current, triggerRef.current);

    // 3. Update Sub-systems
    const { enemyBulletsToSpawn } = updateEnemies(dt, time, gameTimeRef.current);
    if (enemyBulletsToSpawn.length > 0) addProjectiles(enemyBulletsToSpawn);

    // Pass aimDirRef to updateProjectiles so lasers can rotate while charging
    const { newExplosions } = updateProjectiles(dt, time, enemiesRef.current, aimDirRef.current);
    // Handle expirations/timeouts from projectiles (e.g. Swarm Missiles timing out)
    if (newExplosions && newExplosions.length > 0) {
        newExplosions.forEach(exp => spawnExplosion(exp.pos, exp.radius, exp.color));
    }

    updatePickups(dt);
    updateParticles(dt);

    // 4. Collisions
    checkCollisions(time, dt);

  }, [gameState, isPaused, updatePlayer, handleShieldRegen, fireWeapon, updateEnemies, addProjectiles, updateProjectiles, updatePickups, updateParticles, checkCollisions, spawnExplosion]);

  return {
    stats, score, playerPosRef, cameraPosRef, joystickDirRef, aimDirRef, triggerRef,
    initGame, update, setStats, addUpgrade, statsRef, lastPlayerHitTime: lastPlayerHitTimeRef,
    syncWithPersistentData, autoAttack, setAutoAttack,
    // Expose split refs for the renderer
    enemiesRef, projectilesRef, pickupsRef, particlesRef,
    runMetricsRef,
    triggerManualLevelUp,
    onUpgradeSelected
  };
};
