
import { useRef, useCallback, useState, useEffect } from 'react';
import {
  GameState, PlayerStats, PersistentData, GameDifficulty, Upgrade, UpgradeType, EntityType
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
              // Generate Upgrades Logic
              const currentUpgrades = stats.acquiredUpgrades;
              
              // Filter Pool
              const pool = UPGRADES.filter(u => {
                  // If it's a Consumable (infinite), it's always valid
                  if (u.type === UpgradeType.CONSUMABLE) return true;
                  
                  // If it's a Stat/Weapon upgrade, check Max Stacks
                  const count = currentUpgrades.filter(owned => owned.id === u.id).length;
                  return count < u.maxStacks;
              });

              // Weighted Random Selection
              const selection = [];
              const poolCopy = [...pool];
              
              for (let i = 0; i < 3; i++) {
                  if (poolCopy.length === 0) break;
                  
                  // Calculate Total Weight
                  const totalWeight = poolCopy.reduce((sum, u) => sum + u.weight, 0);
                  let r = Math.random() * totalWeight;
                  
                  for (let j = 0; j < poolCopy.length; j++) {
                      r -= poolCopy[j].weight;
                      if (r <= 0) {
                          selection.push(poolCopy[j]);
                          // If unique, remove from temp pool so we don't pick it twice in same hand
                          poolCopy.splice(j, 1);
                          break;
                      }
                  }
              }

              setOfferedUpgrades(selection);
              setHasGeneratedOffers(true);
          }
      } else {
          setHasGeneratedOffers(false);
      }
  }, [gameState, hasGeneratedOffers, stats.pendingLevelUps, stats.acquiredUpgrades, setGameState, setOfferedUpgrades]);

  // Handle Upgrade Selection (Consumable Effects vs Stat Application)
  const onUpgradeSelected = useCallback((upgrade: Upgrade) => {
      
      // 1. Handle Consumables (Logic-based)
      if (upgrade.type === UpgradeType.CONSUMABLE) {
          switch(upgrade.id) {
              case 'cons_heal':
                  setStats(s => ({ ...s, currentHealth: s.maxHealth }));
                  spawnSpawnFlash(playerPosRef.current);
                  spawnDamageText(playerPosRef.current, 0, '#4ade80'); // Green text
                  break;
              case 'cons_shield':
                  setStats(s => ({ ...s, currentShield: s.maxShield }));
                  spawnSpawnFlash(playerPosRef.current);
                  break;
              case 'cons_emp':
                  // Kill all non-boss enemies
                  enemiesRef.current.forEach(e => {
                      if (e.type !== EntityType.ENEMY_BOSS) {
                          e.health = 0; // Collision logic will handle death next frame
                          spawnExplosion(e.pos, 50, '#06b6d4');
                      }
                  });
                  // Clear Enemy Bullets
                  projectilesRef.current = projectilesRef.current.filter(p => p.type !== EntityType.ENEMY_BULLET);
                  // Flash Screen
                  spawnSpawnFlash(playerPosRef.current);
                  break;
              case 'cons_nuke':
                   // Massive Damage in Radius
                   spawnExplosion(playerPosRef.current, 600, '#f97316'); // Visual
                   enemiesRef.current.forEach(e => {
                       const d = Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y);
                       if (d < 800) {
                           e.health -= 5000;
                           spawnDamageText(e.pos, 5000, '#f97316');
                       }
                   });
                   break;
              case 'cons_score':
                  setScore(s => s + 2500);
                  spawnDamageText({ x: playerPosRef.current.x, y: playerPosRef.current.y - 50 }, 2500, '#fbbf24');
                  break;
          }
          
          // Manually decrement level since we aren't calling addUpgrade for consumables
          setStats(p => ({ ...p, pendingLevelUps: Math.max(0, p.pendingLevelUps - 1) }));
      } 
      // 2. Handle Stat/Permanent Upgrades
      else {
          addUpgrade(upgrade);
      }

      // Check if we need to close menu or stay open
      // Use ref-like access via stats (closure might be stale, but we just modified it via setStats logic above)
      // Actually, since setStats is async, we can't trust stats.pendingLevelUps immediately here.
      // However, we know we just decremented it by 1.
      
      const prevPending = stats.pendingLevelUps; 
      const nextPending = Math.max(0, prevPending - 1);

      if (nextPending <= 0) {
          setGameState(GameState.PLAYING);
      }
      
      setOfferedUpgrades([]);
      setHasGeneratedOffers(false);
  }, [setGameState, addUpgrade, setStats, setScore, spawnExplosion, spawnSpawnFlash, spawnDamageText, stats.pendingLevelUps]);


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
