
import React, { useCallback, useRef, useEffect } from 'react';
import { Entity, EntityType, PlayerStats, WeaponType, PersistentData, Upgrade, GameState, Vector2D } from '../../types';
import { UPGRADES, LASER_LENGTH } from '../../constants';
import { POWER_UPS } from '../../systems/PowerUpSystem';
import { SpatialHashGrid } from '../../systems/SpatialHashGrid';

const checkCircleCollision = (a: Entity, b: Entity) => {
    // Optimization: Pre-check bounding box before doing expensive Math.hypot (sqrt)
    if (Math.abs(a.pos.x - b.pos.x) > a.radius + b.radius) return false;
    if (Math.abs(a.pos.y - b.pos.y) > a.radius + b.radius) return false;

    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    const distSq = dx * dx + dy * dy;
    const radSum = a.radius + b.radius;
    return distSq < radSum * radSum;
};

// Distance from point P to line segment VW
const distToSegmentSq = (p: Vector2D, v: Vector2D, w: Vector2D) => {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const distSq = (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
  return distSq;
};

export const useCollision = (
    enemiesRef: React.MutableRefObject<Entity[]>,
    projectilesRef: React.MutableRefObject<Entity[]>,
    pickupsRef: React.MutableRefObject<Entity[]>,
    playerPosRef: React.MutableRefObject<Vector2D>,
    statsRef: React.MutableRefObject<PlayerStats>,
    triggerPlayerHit: (time: number, damage: number) => void,
    spawnDrops: (enemy: Entity) => number,
    spawnDamageText: (pos: Vector2D, dmg: number, color: string) => void,
    spawnExplosion: (pos: Vector2D, radius: number, color: string) => void,
    addParticles: (p: Entity[]) => void,
    setScore: React.Dispatch<React.SetStateAction<number>>,
    setStats: React.Dispatch<React.SetStateAction<PlayerStats>>,
    setOfferedUpgrades: (u: any[]) => void,
    setGameState: (s: GameState) => void,
    persistentData: PersistentData,
    onEnemyHit: () => void,
    onEnemyKilled: () => void,
    onCreditCollected: (amount: number) => void
) => {
    const gridRef = useRef<SpatialHashGrid>(new SpatialHashGrid(250));

    const checkCollisions = useCallback((time: number, dt: number) => {
        const grid = gridRef.current;
        grid.clear();

        const enemies = enemiesRef.current;
        const projectiles = projectilesRef.current;
        const pickups = pickupsRef.current;
        const playerPos = playerPosRef.current;
        const pStats = statsRef.current;

        // 1. Insert Enemies into Grid
        enemies.forEach(e => grid.insert(e));

        // 2. Projectile vs Enemy
        for (const p of projectiles) {
            if (p.health <= 0) continue;
            // Enemy Bullets don't hit enemies
            if (p.type === EntityType.ENEMY_BULLET) continue;

            if (p.weaponType === WeaponType.LASER) {
                // RAYCAST / LINE COLLISION FOR LASER
                if (p.isFiring) {
                    const angle = p.angle || 0;
                    const startX = playerPos.x;
                    const startY = playerPos.y;
                    const endX = startX + Math.cos(angle) * LASER_LENGTH;
                    const endY = startY + Math.sin(angle) * LASER_LENGTH;

                    // Naive check against all enemies for Laser (optimization: use grid raycast in future)
                    // For now, just iterate enemies as laser penetrates everything
                    enemies.forEach(e => {
                        const distSq = distToSegmentSq(e.pos, {x: startX, y: startY}, {x: endX, y: endY});
                        if (distSq < (e.radius + 20) ** 2) { // 20 is laser thickness approx
                            // Tick Damage
                            if (time - (e.lastHitTime || 0) > 100) { // 10 ticks per second
                                e.lastHitTime = time;
                                onEnemyHit(); // Track Stats (Laser counts as hit per tick)

                                let dmg = pStats.damage * 0.2; // Continuous beam does less dmg per tick
                                
                                // Crits
                                const isCrit = Math.random() < pStats.critChance;
                                if (isCrit) dmg *= pStats.critMultiplier;

                                // Shield Logic
                                let hullDmg = dmg;
                                if (e.shield && e.shield > 0) {
                                    e.lastShieldHitTime = time;
                                    if (e.shield >= dmg) {
                                        e.shield -= dmg;
                                        hullDmg = 0;
                                    } else {
                                        hullDmg -= e.shield;
                                        e.shield = 0;
                                    }
                                }
                                
                                if (hullDmg > 0) e.health -= hullDmg;
                                spawnDamageText(e.pos, dmg, isCrit ? '#facc15' : '#fff');
                            }
                        }
                    });
                }
            } else {
                // STANDARD PROJECTILE (Plasma / Missile)
                const candidates = grid.retrieve(p);
                for (const e of candidates) {
                    if (e.health <= 0) continue;

                    if (checkCircleCollision(p, e)) {
                        // HIT!
                        onEnemyHit(); // Track Stats

                        let damage = pStats.damage;
                        const isCrit = Math.random() < pStats.critChance;
                        if (isCrit) damage *= pStats.critMultiplier;

                        // Missile AOE
                        if (p.weaponType === WeaponType.MISSILE) {
                            // Use dynamic missile radius from stats (Default 150)
                            const explosionRad = pStats.missileRadius;
                            
                            spawnExplosion(p.pos, explosionRad, '#fb923c'); // Visual Boom
                            // Area Damage
                             enemies.forEach(subE => {
                                 const dist = Math.hypot(subE.pos.x - p.pos.x, subE.pos.y - p.pos.y);
                                 if (dist < explosionRad) { // AOE Radius
                                     let subDmg = damage;
                                     // Falloff
                                     if (dist > (explosionRad * 0.4)) subDmg *= 0.7;
                                     
                                     // Shield Logic for subE
                                     let sHullDmg = subDmg;
                                     if (subE.shield && subE.shield > 0) {
                                         subE.lastShieldHitTime = time;
                                         if (subE.shield >= subDmg) {
                                             subE.shield -= subDmg;
                                             sHullDmg = 0;
                                         } else {
                                             sHullDmg -= subE.shield;
                                             subE.shield = 0;
                                         }
                                     }
                                     if (sHullDmg > 0) subE.health -= sHullDmg;
                                     subE.lastHitTime = time;
                                     spawnDamageText(subE.pos, subDmg, '#fb923c');
                                 }
                             });
                             p.health = 0; // Missile dies on contact
                        } else {
                            // Plasma / Standard Logic
                            
                            // Apply Slow (Cryo-Plasma Meta)
                            if (pStats.weaponType === WeaponType.PLASMA) {
                                const chillLvl = persistentData.metaLevels['meta_plas_area'] || 0;
                                if (chillLvl > 0) {
                                    e.slowUntil = time + 2000;
                                    e.slowFactor = 0.3; // 30% slow
                                }
                            }

                            // Shield Logic
                            let hullDmg = damage;
                            if (e.shield && e.shield > 0) {
                                e.lastShieldHitTime = time;
                                if (e.shield >= damage) {
                                    e.shield -= damage;
                                    hullDmg = 0;
                                } else {
                                    hullDmg -= e.shield;
                                    e.shield = 0;
                                }
                            }

                            if (hullDmg > 0) e.health -= hullDmg;
                            e.lastHitTime = time;
                            spawnDamageText(e.pos, damage, isCrit ? '#facc15' : '#fff');
                            spawnExplosion(p.pos, 20, '#22d3ee'); // Small hit puff

                            p.pierceCount = (p.pierceCount || 1) - 1;
                            if (p.pierceCount <= 0) p.health = 0;
                        }
                        break; // Collided with one enemy, handle next bullet
                    }
                }
            }
        }

        // 3. Player vs Enemy (Body Collision)
        // Check surrounding cells of player
        const playerCandidates = grid.retrieve({ pos: playerPos, radius: 20 } as Entity);
        for (const e of playerCandidates) {
            const dist = Math.hypot(e.pos.x - playerPos.x, e.pos.y - playerPos.y);
            // Player radius approx 20, enemy radius varies
            if (dist < 20 + e.radius) {
                // Collision damage logic
                triggerPlayerHit(time, 15); // Static 15 dmg on collision for now
            }
        }

        // 4. Enemy Projectiles vs Player
        for (const p of projectiles) {
            if (p.type !== EntityType.ENEMY_BULLET) continue;
            const dist = Math.hypot(p.pos.x - playerPos.x, p.pos.y - playerPos.y);
            if (dist < 20 + p.radius) {
                // Enemy Bullet Hit
                let dmg = 10;
                if (p.isElite) dmg = 20;
                if (p.isMiniboss) dmg = 35;
                
                triggerPlayerHit(time, dmg);
                p.health = 0;
            }
        }

        // 5. Pickup Collection
        for (const p of pickups) {
            const dist = Math.hypot(p.pos.x - playerPos.x, p.pos.y - playerPos.y);
            if (dist < 40) { // Collection range
                // Apply Effect
                if (p.type === EntityType.XP_GEM) {
                    setStats(prev => {
                        let newXp = prev.xp + (p.value || 1);
                        let newLevel = prev.level;
                        let newXpToNext = prev.xpToNextLevel;
                        let leveledUp = false;

                        // Level Up Loop
                        while (newXp >= newXpToNext) {
                            newXp -= newXpToNext;
                            newLevel++;
                            newXpToNext = Math.floor(newXpToNext * 1.2);
                            leveledUp = true;
                        }

                        if (leveledUp) {
                            // Generate upgrades
                            const pool = UPGRADES.filter(u => !prev.acquiredUpgrades.some(owned => owned.id === u.id) || u.id === 'health_pack'); // Allow repeatable health
                            const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
                            setOfferedUpgrades(shuffled);
                            setGameState(GameState.LEVELING);
                        }
                        
                        return { ...prev, xp: newXp, level: newLevel, xpToNextLevel: newXpToNext };
                    });
                } else if (p.type === EntityType.CREDIT) {
                    const amount = Math.floor((p.value || 0) * pStats.creditMultiplier);
                    setStats(prev => ({ ...prev, credits: prev.credits + amount }));
                    onCreditCollected(amount);
                } else if (p.type === EntityType.POWERUP && p.powerUpId) {
                     const config = POWER_UPS[p.powerUpId];
                     if (config) {
                         setStats(prev => config.onPickup(prev, time));
                     }
                }
                
                p.health = 0; 
            }
        }

        // 6. Death Logic
        enemies.forEach(e => {
            if (e.health <= 0) {
                onEnemyKilled(); // Track Stats
                const scoreAdd = spawnDrops(e);
                setScore(s => s + scoreAdd);
                spawnExplosion(e.pos, e.radius * 2.5, e.color); // BOOM!
            }
        });

    }, [gridRef, onCreditCollected, onEnemyHit, onEnemyKilled, triggerPlayerHit, spawnDrops, spawnDamageText, spawnExplosion, setScore, setStats, setOfferedUpgrades, setGameState, persistentData]);

    return { checkCollisions };
};
