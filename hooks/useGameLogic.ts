
import { useRef, useCallback, useState } from 'react';
import {
  GameState, PlayerStats, PersistentData, GameDifficulty
} from '../types';
import { INITIAL_STATS, WORLD_SIZE, DIFFICULTY_CONFIGS } from '../constants';
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

  const { enemiesRef, initEnemies, updateEnemies } = useEnemies(playerPosRef, difficultyConfig);
  
  const handleShotFired = useCallback(() => {
      runMetricsRef.current.shotsFired++;
  }, []);
  
  const { projectilesRef, autoAttack, setAutoAttack, initProjectiles, fireWeapon, updateProjectiles, addProjectiles } = useProjectiles(playerPosRef, statsRef, handleShotFired);
  const { pickupsRef, initPickups, spawnDrops, updatePickups } = usePickups(playerPosRef, statsRef, difficultyConfig);
  const { particlesRef, initParticles, spawnDamageText, spawnExplosion, updateParticles, addParticles } = useParticles();

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
    setScore, setStats, setOfferedUpgrades, setGameState, persistentData,
    handleEnemyHit, handleEnemyKilled, handleCreditCollected
  );

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
    // updateProjectiles can return new explosions or events if needed

    updatePickups(dt);
    updateParticles(dt);

    // 4. Collisions
    checkCollisions(time, dt);

  }, [gameState, isPaused, updatePlayer, handleShieldRegen, fireWeapon, updateEnemies, addProjectiles, updateProjectiles, updatePickups, updateParticles, checkCollisions]);

  return {
    stats, score, playerPosRef, cameraPosRef, joystickDirRef, aimDirRef, triggerRef,
    initGame, update, setStats, addUpgrade, statsRef, lastPlayerHitTime: lastPlayerHitTimeRef,
    syncWithPersistentData, autoAttack, setAutoAttack,
    // Expose split refs for the renderer
    enemiesRef, projectilesRef, pickupsRef, particlesRef,
    runMetricsRef
  };
};
