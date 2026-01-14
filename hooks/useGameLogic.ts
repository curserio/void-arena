
import { useRef, useCallback, useState, useEffect } from 'react';
import { 
  GameState, Entity, EntityType, PlayerStats, Vector2D, 
  WeaponType, PersistentData, Upgrade, PowerUpType 
} from '../types';
import { INITIAL_STATS, SHIPS, UPGRADES, WORLD_SIZE, CAMERA_LERP, TARGETING_RADIUS, BULLET_MAX_DIST, XP_PER_GEM, WEAPON_BASE_STATS } from '../constants';

export const useGameLogic = (
  gameState: GameState,
  setGameState: (s: GameState) => void,
  persistentData: PersistentData,
  setOfferedUpgrades: (u: any[]) => void,
  isPaused: boolean
) => {
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [score, setScore] = useState(0);
  const [autoAttack, setAutoAttack] = useState(true);
  
  const playerPosRef = useRef<Vector2D>({ x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 });
  const cameraPosRef = useRef<Vector2D>({ x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 });
  const entitiesRef = useRef<Entity[]>([]);
  const joystickDirRef = useRef<Vector2D>({ x: 0, y: 0 });
  const lastFireTimeRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const gameTimeRef = useRef(0);
  const statsRef = useRef<PlayerStats>(INITIAL_STATS);
  const lastPlayerHitTimeRef = useRef(0);

  useEffect(() => { statsRef.current = stats; }, [stats]);

  const syncWithPersistentData = useCallback((newData: PersistentData) => {
    setStats(current => {
      const shipConfig = SHIPS.find(s => s.type === newData.equippedShip) || SHIPS[0];
      const weapon = newData.equippedWeapon || WeaponType.PLASMA;
      const baseWStats = WEAPON_BASE_STATS[weapon];

      const hpL = newData.metaLevels['meta_hp'] || 0;
      const dmgL = newData.metaLevels['meta_dmg'] || 0;
      const magL = newData.metaLevels['meta_magnet'] || 0;
      const spdL = newData.metaLevels['meta_speed'] || 0;
      const shL = newData.metaLevels['meta_shield_max'] || 0;

      let bCount = 1;
      let bSpeed = baseWStats.bulletSpeed;
      let bDamageMult = 1.0;
      let bPierce = 1;

      if (weapon === WeaponType.PLASMA) {
        bCount = 1 + (newData.metaLevels['meta_plas_count'] || 0);
        bSpeed *= (1 + (newData.metaLevels['meta_plas_spd'] || 0) * 0.15);
        bDamageMult *= (1 + (newData.metaLevels['meta_plas_dmg'] || 0) * 0.15);
      } else if (weapon === WeaponType.MISSILE) {
        bDamageMult *= (1 + (newData.metaLevels['meta_msl_dmg'] || 0) * 0.2);
      } else if (weapon === WeaponType.LASER) {
        bDamageMult *= (1 + (newData.metaLevels['meta_lsr_burn'] || 0) * 0.25);
        bPierce = 2 + (newData.metaLevels['meta_lsr_pierce'] || 0);
      }

      let baseMaxHP = (shipConfig.baseStats.maxHealth || 100) * (1 + hpL * 0.15);
      let baseMaxShield = (shipConfig.baseStats.maxShield || 25) * (1 + shL * 0.20);
      let baseDamage = (baseWStats.damage) * (1 + dmgL * 0.10) * bDamageMult;
      let baseMagnet = (INITIAL_STATS.magnetRange) * (1 + magL * 0.25);
      let baseSpeed = (shipConfig.baseStats.speed || 230) * (1 + spdL * 0.10);

      let finalStats: PlayerStats = { 
        ...current,
        shipType: newData.equippedShip,
        weaponType: weapon,
        maxHealth: baseMaxHP,
        maxShield: baseMaxShield,
        shieldRegen: shipConfig.baseStats.shieldRegen || 2.5,
        speed: baseSpeed,
        damage: baseDamage,
        fireRate: baseWStats.fireRate,
        magnetRange: baseMagnet,
        bulletCount: bCount,
        bulletSpeed: bSpeed,
        pierceCount: bPierce
      };

      current.acquiredUpgrades.forEach(upg => { finalStats = upg.effect(finalStats); });
      finalStats.currentHealth = Math.min(finalStats.maxHealth, current.currentHealth);
      finalStats.currentShield = Math.min(finalStats.maxShield, current.currentShield);
      return finalStats;
    });
  }, []);

  const triggerPlayerHit = useCallback((time: number, damage: number) => {
    lastPlayerHitTimeRef.current = time;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setStats(p => {
      let remainingDmg = damage;
      let newShield = p.currentShield;
      let newHealth = p.currentHealth;
      if (newShield > 0) {
        const shieldDamage = Math.min(newShield, remainingDmg);
        newShield -= shieldDamage;
        remainingDmg -= shieldDamage;
      }
      if (remainingDmg > 0) newHealth = Math.max(0, newHealth - remainingDmg);
      return { ...p, currentShield: newShield, currentHealth: newHealth, lastShieldHitTime: time };
    });
  }, []);

  const spawnEnemy = useCallback(() => {
    const baseDifficultyLevel = Math.max(1, Math.floor(1 + gameTimeRef.current / 45));
    const roll = Math.random();
    let levelOffset = (roll < 0.6) ? (Math.random() > 0.5 ? -1 : -2) : (roll > 0.95 ? 3 : (roll > 0.9 ? 1 : 0));
    const enemyLevel = Math.max(1, baseDifficultyLevel + levelOffset);
    const isElite = levelOffset >= 3;
    
    const typeRoll = Math.random();
    let type = EntityType.ENEMY_SCOUT;
    if (typeRoll > 0.88 && gameTimeRef.current > 20) {
      type = EntityType.ENEMY_LASER_SCOUT;
    } else if (typeRoll > 0.75) {
      type = EntityType.ENEMY_STRIKER;
    }

    const a = Math.random() * Math.PI * 2; 
    const d = 800 + Math.random() * 400;
    const x = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.x + Math.cos(a) * d));
    const y = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.y + Math.sin(a) * d));
    
    const levelMult = 1 + (enemyLevel - 1) * 0.25;
    const eliteScale = isElite ? 1.5 : 1.0;

    let baseHp = (type === EntityType.ENEMY_STRIKER ? 300 : 120) * levelMult;
    let hasShield = isElite || (enemyLevel >= 3 && Math.random() > 0.6);
    let mShield = hasShield ? baseHp * 0.4 * eliteScale : 0;
    let color = isElite ? '#f0f' : (type === EntityType.ENEMY_STRIKER ? `hsl(${340 + Math.random() * 20}, 80%, 60%)` : `hsl(${260 + Math.random() * 30}, 80%, 60%)`);

    if (type === EntityType.ENEMY_LASER_SCOUT) {
      baseHp = (enemyLevel * 25) + 50; 
      mShield = (baseHp * 4.0) * eliteScale; 
      color = '#a855f7';
    }

    entitiesRef.current.push({
      id: Math.random().toString(36), 
      type: type,
      pos: { x, y }, vel: { x: 0, y: 0 }, 
      radius: (type === EntityType.ENEMY_STRIKER ? 24 : 22) * eliteScale * Math.min(1.4, 1 + (levelMult - 1) * 0.1),
      health: baseHp * eliteScale, maxHealth: baseHp * eliteScale, 
      shield: mShield, maxShield: mShield,
      color: color,
      isMelee: type === EntityType.ENEMY_STRIKER, 
      level: enemyLevel, aiPhase: Math.random() * Math.PI * 2, aiSeed: Math.random(),
      lastHitTime: 0, lastShieldHitTime: 0,
      isCharging: false, isFiring: false, chargeProgress: 0, lastShotTime: 0
    });
  }, []);

  const initGame = useCallback(() => {
    const shipConfig = SHIPS.find(s => s.type === persistentData.equippedShip) || SHIPS[0];
    const weapon = persistentData.equippedWeapon || WeaponType.PLASMA;
    const baseWStats = WEAPON_BASE_STATS[weapon];
    const hpL = persistentData.metaLevels['meta_hp'] || 0;
    const dmgL = persistentData.metaLevels['meta_dmg'] || 0;
    const magL = persistentData.metaLevels['meta_magnet'] || 0;
    const spdL = persistentData.metaLevels['meta_speed'] || 0;
    const shL = persistentData.metaLevels['meta_shield_max'] || 0;
    
    let bCount = 1;
    let bSpeed = baseWStats.bulletSpeed;
    let bDamageMult = 1.0;
    let bPierce = 1;
    if (weapon === WeaponType.PLASMA) {
      bCount = 1 + (persistentData.metaLevels['meta_plas_count'] || 0);
      bSpeed *= (1 + (persistentData.metaLevels['meta_plas_spd'] || 0) * 0.15);
      bDamageMult *= (1 + (persistentData.metaLevels['meta_plas_dmg'] || 0) * 0.15);
    } else if (weapon === WeaponType.MISSILE) {
      bDamageMult *= (1 + (persistentData.metaLevels['meta_msl_dmg'] || 0) * 0.2);
    } else if (weapon === WeaponType.LASER) {
      bDamageMult *= (1 + (persistentData.metaLevels['meta_lsr_burn'] || 0) * 0.25);
      bPierce = 2 + (persistentData.metaLevels['meta_lsr_pierce'] || 0);
    }

    const finalMaxHP = (shipConfig.baseStats.maxHealth || 100) * (1 + hpL * 0.15);
    const finalMaxShield = (shipConfig.baseStats.maxShield || 20) * (1 + shL * 0.20);
    const finalSpeed = (shipConfig.baseStats.speed || 230) * (1 + spdL * 0.10);

    const metaStats: PlayerStats = { 
      ...INITIAL_STATS, 
      ...shipConfig.baseStats, 
      shipType: persistentData.equippedShip,
      weaponType: weapon,
      maxHealth: finalMaxHP,
      currentHealth: finalMaxHP,
      maxShield: finalMaxShield,
      currentShield: finalMaxShield,
      speed: finalSpeed,
      damage: baseWStats.damage * (1 + dmgL * 0.10) * bDamageMult,
      fireRate: baseWStats.fireRate,
      magnetRange: INITIAL_STATS.magnetRange * (1 + magL * 0.25),
      bulletCount: bCount,
      bulletSpeed: bSpeed,
      pierceCount: bPierce
    };
    
    playerPosRef.current = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
    cameraPosRef.current = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
    entitiesRef.current = [];
    setStats(metaStats);
    setScore(0);
    gameTimeRef.current = 0;
    setGameState(GameState.PLAYING);
    spawnTimerRef.current = 0;
    lastPlayerHitTimeRef.current = 0;

    for (let i = 0; i < 20; i++) {
        const r = 35 + Math.random() * 45;
        entitiesRef.current.push({
            id: Math.random().toString(36), type: EntityType.ASTEROID, 
            pos: { x: Math.random() * WORLD_SIZE, y: Math.random() * WORLD_SIZE },
            vel: { x: (Math.random()-0.5)*40, y: (Math.random()-0.5)*40 },
            radius: r, health: r*5, maxHealth: r*5, color: '#475569', seed: Math.random(),
            lastHitTime: 0
        });
    }
  }, [persistentData, setGameState]);

  const update = (time: number, dt: number) => {
    if (gameState !== GameState.PLAYING || isPaused) return;
    gameTimeRef.current += dt;
    const pStats = statsRef.current;
    const isOverdrive = time < pStats.buffs.overdriveUntil;
    const isOmni = time < pStats.buffs.omniUntil;
    const isPierce = time < pStats.buffs.pierceUntil;

    playerPosRef.current.x += joystickDirRef.current.x * pStats.speed * dt;
    playerPosRef.current.y += joystickDirRef.current.y * pStats.speed * dt;
    playerPosRef.current.x = Math.max(30, Math.min(WORLD_SIZE - 30, playerPosRef.current.x));
    playerPosRef.current.y = Math.max(30, Math.min(WORLD_SIZE - 30, playerPosRef.current.y));
    cameraPosRef.current.x += (playerPosRef.current.x - cameraPosRef.current.x) * CAMERA_LERP;
    cameraPosRef.current.y += (playerPosRef.current.y - cameraPosRef.current.y) * CAMERA_LERP;

    if (time - pStats.lastShieldHitTime > 3000 && pStats.currentShield < pStats.maxShield) {
      setStats(p => ({ ...p, currentShield: Math.min(p.maxShield, p.currentShield + p.shieldRegen * dt) }));
    }

    spawnTimerRef.current += dt;
    if (spawnTimerRef.current > Math.max(0.4, 1.4 - (gameTimeRef.current / 180))) { spawnEnemy(); spawnTimerRef.current = 0; }

    const fr = isOverdrive ? pStats.fireRate * 2.5 : pStats.fireRate;
    
    if (autoAttack && (time - lastFireTimeRef.current > 1000 / fr)) {
      let nearest: Entity | null = null; let minDist = TARGETING_RADIUS;
      entitiesRef.current.forEach(e => {
        if (e.type === EntityType.ENEMY_SCOUT || e.type === EntityType.ENEMY_STRIKER || e.type === EntityType.ENEMY_LASER_SCOUT || e.type === EntityType.ASTEROID) {
          const d = Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y);
          if (d < minDist) { minDist = d; nearest = e; }
        }
      });
      if (nearest) {
        lastFireTimeRef.current = time;
        const baseAngle = Math.atan2(nearest.pos.y - playerPosRef.current.y, nearest.pos.x - playerPosRef.current.x);
        const angles = isOmni ? [-0.3, 0, 0.3] : [0]; 
        angles.forEach(spreadAngle => {
          const currentAngle = baseAngle + spreadAngle;
          if (pStats.weaponType === WeaponType.PLASMA) {
            const spacing = 15;
            const startOffset = -(pStats.bulletCount - 1) * spacing / 2;
            for (let i = 0; i < pStats.bulletCount; i++) {
              const offset = startOffset + i * spacing;
              const px = playerPosRef.current.x + Math.cos(currentAngle + Math.PI/2) * offset;
              const py = playerPosRef.current.y + Math.sin(currentAngle + Math.PI/2) * offset;
              entitiesRef.current.push({
                id: Math.random().toString(36), type: EntityType.BULLET, pos: { x: px, y: py },
                vel: { x: Math.cos(currentAngle) * pStats.bulletSpeed, y: Math.sin(currentAngle) * pStats.bulletSpeed },
                radius: 8, health: 1, maxHealth: 1, color: '#22d3ee', pierceCount: isPierce ? 99 : 1
              });
            }
          } else if (pStats.weaponType === WeaponType.MISSILE) {
            entitiesRef.current.push({
              id: Math.random().toString(36), type: EntityType.BULLET, pos: { ...playerPosRef.current },
              vel: { x: Math.cos(currentAngle) * pStats.bulletSpeed, y: Math.sin(currentAngle) * pStats.bulletSpeed },
              radius: 14, health: 1, maxHealth: 1, color: '#fb923c', weaponType: WeaponType.MISSILE
            });
          } else if (pStats.weaponType === WeaponType.LASER) {
            entitiesRef.current.push({
              id: Math.random().toString(36), type: EntityType.BULLET, pos: { ...playerPosRef.current },
              vel: { x: 0, y: 0 }, 
              radius: 18, health: 1, maxHealth: 1, color: '#a855f7', weaponType: WeaponType.LASER,
              isCharging: true, chargeProgress: 0, angle: currentAngle, 
              pierceCount: isPierce ? 99 : pStats.pierceCount
            });
          }
        });
      }
    }

    const nextEnts: Entity[] = [];
    const targets = entitiesRef.current.filter(e => e.type === EntityType.ENEMY_SCOUT || e.type === EntityType.ENEMY_STRIKER || e.type === EntityType.ENEMY_LASER_SCOUT || e.type === EntityType.ASTEROID);
    
    const spawnDamageText = (pos: Vector2D, dmg: number, color: string = '#ffffff') => {
      if (dmg <= 0) return;
      nextEnts.push({
        id: Math.random().toString(36),
        type: EntityType.DAMAGE_NUMBER,
        pos: { x: pos.x + (Math.random() - 0.5) * 30, y: pos.y - 15 },
        vel: { x: (Math.random() - 0.5) * 60, y: -120 },
        radius: 0, health: 1, maxHealth: 1, color: color,
        value: Math.floor(dmg), duration: 0, maxDuration: 0.8
      });
    };

    const applyDamage = (target: Entity, amount: number) => {
      let remaining = amount;
      let usedColor = '#ffffff';

      if (target.shield !== undefined && target.shield > 0) {
        const shieldHit = Math.min(target.shield, remaining);
        target.shield -= shieldHit;
        remaining -= shieldHit;
        target.lastShieldHitTime = time;
        usedColor = '#06fdfd'; 
      }
      
      if (remaining > 0) {
        target.health -= remaining;
      }
      
      target.lastHitTime = time;
      spawnDamageText(target.pos, amount, usedColor);
    };

    entitiesRef.current.forEach(e => {
      let alive = true;

      if (e.type === EntityType.DAMAGE_NUMBER) {
        e.duration = (e.duration || 0) + dt;
        e.pos.x += e.vel.x * dt; e.pos.y += e.vel.y * dt;
        if (e.duration >= (e.maxDuration || 0.8)) alive = false;
      } else if (e.type === EntityType.BULLET && e.weaponType === WeaponType.LASER && e.isCharging) {
          e.chargeProgress = (e.chargeProgress || 0) + dt * 2.0; e.pos = { ...playerPosRef.current }; 
          let nearestDuringCharge: Entity | null = null; let minD = TARGETING_RADIUS;
          targets.forEach(en => { const d = Math.hypot(en.pos.x - e.pos.x, en.pos.y - e.pos.y); if (d < minD) { minD = d; nearestDuringCharge = en; } });
          if (nearestDuringCharge) { const target = nearestDuringCharge as Entity; e.angle = Math.atan2(target.pos.y - e.pos.y, target.pos.x - e.pos.x); }
          if (e.chargeProgress >= 1.0) { e.isCharging = false; e.vel = { x: Math.cos(e.angle || 0) * pStats.bulletSpeed, y: Math.sin(e.angle || 0) * pStats.bulletSpeed }; }
      }

      if (e.type === EntityType.EXPLOSION) {
        e.duration = (e.duration || 0) + dt; if (e.duration > (e.maxDuration || 0.4)) alive = false;
      } else if (e.type === EntityType.ENEMY_SCOUT || e.type === EntityType.ENEMY_STRIKER || e.type === EntityType.ENEMY_LASER_SCOUT) {
        const dx = playerPosRef.current.x - e.pos.x, dy = playerPosRef.current.y - e.pos.y, d = Math.hypot(dx, dy);
        const baseSpd = (e.type === EntityType.ENEMY_STRIKER ? 100 : 70) * (1 + ((e.level || 1) * 0.05));
        let sepX = 0, sepY = 0;
        targets.forEach(other => { if (other.id === e.id) return; const odx = e.pos.x - other.pos.x, ody = e.pos.y - other.pos.y, od = Math.hypot(odx, ody); if (od < 80) { sepX += (odx / od) * (80 - od) * 1.5; sepY += (ody / od) * (80 - od) * 1.5; } });

        if (e.type === EntityType.ENEMY_LASER_SCOUT) {
          const idealDist = 450;
          
          if (!e.isCharging && !e.isFiring) {
            if (d > idealDist + 50) { e.vel.x = (dx / d) * baseSpd + sepX; e.vel.y = (dy / d) * baseSpd + sepY; }
            else if (d < idealDist - 50) { e.vel.x = (-dx / d) * baseSpd + sepX; e.vel.y = (-dy / d) * baseSpd + sepY; }
            else { e.vel.x = Math.sin(time * 0.001) * baseSpd * 0.5 + sepX; e.vel.y = Math.cos(time * 0.001) * baseSpd * 0.5 + sepY; }
          } else {
            e.vel.x *= 0.85;
            e.vel.y *= 0.85;
          }

          if (!e.isCharging && !e.isFiring && time - (e.lastShotTime || 0) > 4000) {
            e.isCharging = true; e.chargeProgress = 0;
            e.angle = Math.atan2(dy, dx);
          }
          if (e.isCharging) {
            e.chargeProgress = (e.chargeProgress || 0) + dt * 0.3;
            if (e.chargeProgress >= 1.0) { 
              e.isCharging = false; 
              e.isFiring = true; 
              e.chargeProgress = 0; 
              e.lastShotTime = time;
            }
          }
          if (e.isFiring) {
            e.chargeProgress = (e.chargeProgress || 0) + dt * 2.0; 
            const beamAngle = e.angle || 0;
            const playerRelAngle = Math.atan2(playerPosRef.current.y - e.pos.y, playerPosRef.current.x - e.pos.x);
            let angleDiff = Math.abs(beamAngle - playerRelAngle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            
            if (angleDiff < 0.1 && d < 700) {
              triggerPlayerHit(time, 0.5 + (e.level || 1) * 0.15);
            }
            if (e.chargeProgress >= 1.0) { e.isFiring = false; e.chargeProgress = 0; }
          }
        } else if (e.isMelee) {
          const a = Math.atan2(dy, dx) + Math.sin(time * 0.004 + (e.aiPhase || 0)) * 0.4;
          const pulse = 0.8 + Math.sin(time * 0.006 + (e.aiPhase || 0)) * 0.4;
          e.vel.x = Math.cos(a) * baseSpd * pulse + sepX; e.vel.y = Math.sin(a) * baseSpd * pulse + sepY;
        } else {
          const idealAngle = (e.aiSeed || 0) * Math.PI * 2 + (time * 0.0001);
          const tx = playerPosRef.current.x + Math.cos(idealAngle) * 350, ty = playerPosRef.current.y + Math.sin(idealAngle) * 350;
          const toTX = tx - e.pos.x, toTY = ty - e.pos.y, distT = Math.hypot(toTX, toTY);
          if (distT > 20) { e.vel.x = (toTX / distT) * baseSpd + sepX; e.vel.y = (toTY / distT) * baseSpd + sepY; }
          else { e.vel.x = Math.sin(time * 0.002 + (e.aiPhase || 0)) * 20 + sepX; e.vel.y = Math.cos(time * 0.002 + (e.aiPhase || 0)) * 20 + sepY; }
          if (time - (e.lastShotTime || 0) > 3000) { e.lastShotTime = time; const a = Math.atan2(dy, dx) + (Math.random()-0.5)*0.15; nextEnts.push({ id: Math.random().toString(36), type: EntityType.ENEMY_BULLET, pos: { ...e.pos }, vel: { x: Math.cos(a)*260, y: Math.sin(a)*260 }, radius: 7, health: 1, maxHealth: 1, color: '#f97316', level: e.level }); }
        }

        e.pos.x += e.vel.x * dt; e.pos.y += e.vel.y * dt;
        if (d < e.radius + 20) { if (e.isMelee && time - (e.lastMeleeHitTime || 0) > 150) { e.lastMeleeHitTime = time; triggerPlayerHit(time, 1.2 + (e.level || 1) * 0.4); } }
        
        if (e.health <= 0) {
          alive = false; 
          const baseVal = e.type === EntityType.ENEMY_LASER_SCOUT ? 500 : (e.isMelee ? 250 : 100);
          setScore(s => s + baseVal * (e.level || 1));
          nextEnts.push({ id: Math.random().toString(36), type: EntityType.XP_GEM, pos: { ...e.pos }, vel: { x: 0, y: 0 }, radius: 14, health: 1, maxHealth: 1, color: '#06b6d4', value: XP_PER_GEM * (e.type === EntityType.ENEMY_LASER_SCOUT ? 5 : (e.isMelee ? 3 : 1)) });
          if (Math.random() < 0.25) nextEnts.push({ id: Math.random().toString(36), type: EntityType.CREDIT, pos: { ...e.pos }, vel: { x: 0, y: 0 }, radius: 15, health: 1, maxHealth: 1, color: '#fbbf24', value: (e.type === EntityType.ENEMY_LASER_SCOUT ? 100 : (e.isMelee ? 35 : 15)) });
          if (Math.random() < 0.05) { const types = [PowerUpType.OVERDRIVE, PowerUpType.OMNI_SHOT, PowerUpType.SUPER_PIERCE]; nextEnts.push({ id: Math.random().toString(36), type: EntityType.POWERUP, pos: { ...e.pos }, vel: { x: 0, y: 0 }, radius: 24, health: 1, maxHealth: 1, color: '#fff', powerUpType: types[Math.floor(Math.random()*types.length)] }); }
        }
      } else if (e.type !== EntityType.DAMAGE_NUMBER) {
        if (!e.isCharging) { e.pos.x += e.vel.x * dt; e.pos.y += e.vel.y * dt; }
        if (e.type === EntityType.BULLET) {
          if (!e.isCharging && Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y) > BULLET_MAX_DIST) alive = false;
          else if (!e.isCharging) {
            for (const t of targets) {
              if (Math.hypot(e.pos.x - t.pos.x, e.pos.y - t.pos.y) < t.radius + e.radius) {
                applyDamage(t, pStats.damage);
                if (e.weaponType === WeaponType.MISSILE) {
                  alive = false;
                  const mRad = 110 * (1 + (persistentData.metaLevels['meta_msl_rad'] || 0) * 0.3);
                  const aoeDmg = pStats.damage * 0.5;
                  targets.forEach(other => {
                    if (other.id !== t.id) {
                      if (Math.hypot(other.pos.x - e.pos.x, other.pos.y - e.pos.y) < mRad) applyDamage(other, aoeDmg);
                    }
                  });
                  nextEnts.push({ id: Math.random().toString(36), type: EntityType.EXPLOSION, pos: { ...e.pos }, vel: { x: 0, y: 0 }, radius: mRad, health: 1, maxHealth: 1, color: '#fb923c', duration: 0, maxDuration: 0.6 });
                } else if (e.pierceCount && e.pierceCount > 1) { e.pierceCount--; } else { alive = false; }
                break;
              }
            }
          }
        } else if (e.type === EntityType.ENEMY_BULLET) {
          if (Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y) > BULLET_MAX_DIST) alive = false;
          else if (Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y) < 22 + e.radius) { alive = false; triggerPlayerHit(time, 8 + (e.level || 1)*2); }
        } else if (e.type === EntityType.POWERUP || e.type === EntityType.XP_GEM || e.type === EntityType.CREDIT || e.type === EntityType.HEAL_PICKUP) {
          const d = Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y);
          if (d < pStats.magnetRange) { const pullSpeed = 1800; e.vel.x = ((playerPosRef.current.x - e.pos.x) / d) * pullSpeed; e.vel.y = ((playerPosRef.current.y - e.pos.y) / d) * pullSpeed; }
          if (d < 50) {
            alive = false;
            if (e.type === EntityType.POWERUP) {
                if (e.powerUpType === PowerUpType.OVERDRIVE) setStats(p => ({ ...p, buffs: { ...p.buffs, overdriveUntil: time + 8000 } }));
                else if (e.powerUpType === PowerUpType.OMNI_SHOT) setStats(p => ({ ...p, buffs: { ...p.buffs, omniUntil: time + 10000 } }));
                else if (e.powerUpType === PowerUpType.SUPER_PIERCE) setStats(p => ({ ...p, buffs: { ...p.buffs, pierceUntil: time + 7000 } }));
            } else if (e.type === EntityType.XP_GEM) {
              setStats(p => { const nx = p.xp + (e.value || 0); if (nx >= p.xpToNextLevel) { setTimeout(() => { setOfferedUpgrades([...UPGRADES].sort(() => 0.5 - Math.random()).slice(0, 3)); setGameState(GameState.LEVELING); }, 0); return { ...p, xp: 0, level: p.level + 1, xpToNextLevel: Math.floor(p.xpToNextLevel * 1.5) }; } return { ...p, xp: nx }; });
            } else if (e.type === EntityType.CREDIT) setStats(p => ({ ...p, credits: p.credits + (e.value || 0) }));
            else if (e.type === EntityType.HEAL_PICKUP) setStats(p => ({ ...p, currentHealth: Math.min(p.maxHealth, p.currentHealth + (e.value || 0)) }));
          }
        } else if (e.type === EntityType.ASTEROID) { 
          if (e.health <= 0) { alive = false; setScore(s => s + 75); } 
          if (e.pos.x < e.radius || e.pos.x > WORLD_SIZE - e.radius) e.vel.x *= -1; 
          if (e.pos.y < e.radius || e.pos.y > WORLD_SIZE - e.radius) e.vel.y *= -1; 
        }
      }
      if (alive) nextEnts.push(e);
    };
    entitiesRef.current = nextEnts;
  };

  const addUpgrade = useCallback((upgrade: Upgrade) => { setStats(p => { const newStats = upgrade.effect(p); return { ...newStats, acquiredUpgrades: [...p.acquiredUpgrades, upgrade] }; }); }, []);

  return { stats, score, entitiesRef, playerPosRef, cameraPosRef, joystickDirRef, initGame, update, setStats, addUpgrade, statsRef, lastPlayerHitTime: lastPlayerHitTimeRef, syncWithPersistentData, autoAttack, setAutoAttack };
};
