
import React, { useCallback, useRef, useEffect } from 'react';
import { Entity, EntityType, PlayerStats, WeaponType, PersistentData, Upgrade, GameState, Vector2D } from '../../types';
import { EnemyType, IEnemy } from '../../types/enemies';
import { IProjectile } from '../../types/projectiles';
import { UPGRADES, LASER_LENGTH } from '../../constants';
import { POWER_UPS } from '../../core/systems/PowerUpSystem';
import { SpatialHashGrid } from '../../core/utils/SpatialHashGrid';
import { getEnemyDefinition } from '../../data/enemies/definitions';

// Helper: Check collision between two circular entities
const checkCircleCollision = (a: { pos: Vector2D, radius: number }, b: { pos: Vector2D, radius: number }) => {
    // Optimization: Pre-check bounding box before doing expensive Math.hypot (sqrt)
    if (Math.abs(a.pos.x - b.pos.x) > a.radius + b.radius) return false;
    if (Math.abs(a.pos.y - b.pos.y) > a.radius + b.radius) return false;

    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    const distSq = dx * dx + dy * dy;
    const radSum = a.radius + b.radius;
    return distSq < radSum * radSum;
};

// Helper: Distance from point P to line segment VW
const distToSegmentSq = (p: Vector2D, v: Vector2D, w: Vector2D) => {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const distSq = (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
    return distSq;
};

export const useCollision = (
    enemiesRef: React.MutableRefObject<IEnemy[]>,
    projectilesRef: React.MutableRefObject<IProjectile[]>,
    pickupsRef: React.MutableRefObject<Entity[]>,
    playerPosRef: React.MutableRefObject<Vector2D>,
    statsRef: React.MutableRefObject<PlayerStats>,
    triggerPlayerHit: (time: number, damage: number, source: Entity | string) => void,
    spawnDrops: (enemy: IEnemy) => number,
    spawnDamageText: (pos: Vector2D, dmg: number, color: string) => void,
    spawnExplosion: (pos: Vector2D, radius: number, color: string) => void,
    addParticles: (p: Entity[]) => void, // Pickups/Particles still generic Entity for now
    setScore: React.Dispatch<React.SetStateAction<number>>,
    setStats: React.Dispatch<React.SetStateAction<PlayerStats>>,
    setOfferedUpgrades: (u: any[]) => void,
    persistentData: PersistentData,
    onEnemyHit: () => void,
    onEnemyKilled: () => void,
    onCreditCollected: (amount: number) => void
) => {
    // Grid now stores IEnemy specifically
    const gridRef = useRef<SpatialHashGrid<IEnemy>>(new SpatialHashGrid<IEnemy>(250));

    const checkCollisions = useCallback((time: number, dt: number) => {
        const grid = gridRef.current;
        grid.clear();

        const enemies = enemiesRef.current;
        const projectiles = projectilesRef.current;
        const pickups = pickupsRef.current;
        const playerPos = playerPosRef.current;
        const pStats = statsRef.current;

        // 1. Insert Enemies into Grid
        // IEnemy guarantees pos and radius
        enemies.forEach(e => {
            if (e.isAlive) grid.insert(e);
        });

        const applyDamageToEnemy = (e: IEnemy, dmg: number, isCrit: boolean, explosionColor?: string) => {
            let hullDmg = dmg;

            // Shield Logic
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

            // Death Defiance (Elite Kamikaze Ability)
            // 'hasDeathDefiance' is specific to certain enemies but checking it safely if it exists on IEnemy OR checking type
            // We added optional props to IEnemy/EnemyDefinition so it should be safe.
            if (hullDmg >= e.health && e.hasDeathDefiance) {
                hullDmg = 0;
                e.shield = 0;
                e.hasDeathDefiance = false;
                spawnDamageText(e.pos, 0, '#ffffff');
                spawnExplosion(e.pos, e.radius * 1.5, '#f0f');
            }

            if (hullDmg > 0) e.health -= hullDmg;

            e.lastHitTime = time;

            let textColor = isCrit ? '#facc15' : '#fff';
            if (explosionColor) textColor = explosionColor;

            spawnDamageText(e.pos, dmg, textColor);
        };

        // 2. Projectile vs Enemy
        for (const p of projectiles) {
            if (!p.isAlive) continue;
            // Enemy Bullets don't hit enemies
            if (p.type === EntityType.ENEMY_BULLET) continue;

            if (p.weaponType === WeaponType.LASER) {
                // Determine if firing (Laser Logic)
                // We need to cast or check property as IProjectile has optional isFiring
                if (p.isFiring) {
                    const angle = p.angle || 0;
                    const startX = playerPos.x;
                    const startY = playerPos.y;
                    const endX = startX + Math.cos(angle) * LASER_LENGTH;
                    const endY = startY + Math.sin(angle) * LASER_LENGTH;

                    // For lasers, we iterate all enemies? Or use a broadphase line check?
                    // Iterating all is safer for beam accuracy, or we can query grid cells along the line.
                    // For now, iterate all (simpler for lasers as they are instant)
                    enemies.forEach(e => {
                        if (!e.isAlive) return;
                        const distSq = distToSegmentSq(e.pos, { x: startX, y: startY }, { x: endX, y: endY });
                        if (distSq < (e.radius + 20) ** 2) {
                            if (time - (e.lastHitTime || 0) > 100) {
                                onEnemyHit();

                                let dmg = pStats.damage * 0.2;
                                const isCrit = Math.random() < pStats.critChance;
                                if (isCrit) dmg *= pStats.critMultiplier;

                                applyDamageToEnemy(e, dmg, isCrit);
                            }
                        }
                    });
                }
            } else {
                // STANDARD PROJECTILE (Plasma / Missile / Swarm)
                const candidates = grid.retrieve(p.pos);
                for (const e of candidates) {
                    if (e.health <= 0) continue;

                    if (checkCircleCollision(p, e)) {
                        onEnemyHit();

                        let damage = pStats.damage;
                        const isCrit = Math.random() < pStats.critChance;
                        if (isCrit) damage *= pStats.critMultiplier;

                        if (p.weaponType === WeaponType.MISSILE || p.weaponType === WeaponType.SWARM_LAUNCHER) {

                            const isSwarm = p.weaponType === WeaponType.SWARM_LAUNCHER;
                            const explosionRad = isSwarm ? 150 : pStats.missileRadius;
                            const boomColor = isSwarm ? '#e879f9' : '#fb923c';

                            spawnExplosion(p.pos, explosionRad, boomColor);

                            // Splash Damage - iterate all enemies again or query grid?
                            // Query grid with larger radius
                            // For simplicity, iterating candidates from current cell might miss edge cases, 
                            // but iterate all is expensive.
                            // Let's iterate all for splash to be safe for now, or use query.
                            // Optimization: Check distance.
                            enemies.forEach(subE => {
                                if (!subE.isAlive) return;
                                const dist = Math.hypot(subE.pos.x - p.pos.x, subE.pos.y - p.pos.y);
                                if (dist < explosionRad) {
                                    let subDmg = damage;
                                    if (dist > (explosionRad * 0.4)) subDmg *= 0.7;
                                    applyDamageToEnemy(subE, subDmg, isCrit, boomColor);
                                }
                            });
                            p.isAlive = false;
                            p.health = 0; // Sync
                        } else {
                            // PLASMA
                            if (pStats.weaponType === WeaponType.PLASMA) {
                                const chillLvl = persistentData.metaLevels['meta_plas_area'] || 0;
                                if (chillLvl > 0) {
                                    e.slowUntil = time + 2000;
                                    e.slowFactor = 0.3;
                                }
                            }

                            applyDamageToEnemy(e, damage, isCrit);
                            spawnExplosion(p.pos, 20, '#22d3ee');

                            if (p.pierceCount !== undefined) {
                                p.pierceCount -= 1;
                                if (p.pierceCount <= 0) {
                                    p.isAlive = false;
                                    p.health = 0;
                                }
                            } else {
                                p.isAlive = false;
                                p.health = 0;
                            }
                        }
                        break; // Hit one enemy per frame per projectile (unless piercing handled differently?)
                        // If piercing, we shouldn't break? 
                        // Current logic: break after hitting ONE candidate to prevent hitting multiple in same frame?
                        // But piercing allows hitting multiple?
                        // Implementation of Pierce in loop:
                        // Typically you track 'hitEntities' to not hit same one twice.
                        // For Void Arena, simpler check matches legacy.
                    }
                }
            }
        }

        // 3. Player vs Enemy (Body Collision)
        const playerCandidates = grid.retrieve(playerPos);
        for (const e of playerCandidates) {
            const dist = Math.hypot(e.pos.x - playerPos.x, e.pos.y - playerPos.y);
            if (dist < 20 + e.radius) {
                // KAMIKAZE: Explode on contact (Damage handled in Death Logic below)
                if (e.enemyType === EnemyType.KAMIKAZE) {
                    e.health = 0; // Trigger death
                    continue;
                }

                let collisionDmg = 15; // Base collision damage

                // Only Strikers scale melee collision damage with tier
                if (e.enemyType === EnemyType.STRIKER) {
                    const baseDmg = getEnemyDefinition(e.enemyType).attacks?.collision ?? 15;
                    // Multiplicative level scaling to preserve tier differences at high levels
                    collisionDmg = baseDmg * e.damageMult * (1 + (e.level || 1) * 0.05);
                }

                // Bosses have massive mass multiplier
                const isBoss = e.enemyType === EnemyType.BOSS_DREADNOUGHT || e.enemyType === EnemyType.BOSS_DESTROYER;
                if (isBoss) collisionDmg *= 1.5;

                triggerPlayerHit(time, collisionDmg, e as unknown as Entity);
            }
        }

        // 4. Enemy Projectiles vs Player
        for (const p of projectiles) {
            if (!p.isAlive) continue;
            if (p.type !== EntityType.ENEMY_BULLET) continue;

            const dist = Math.hypot(p.pos.x - playerPos.x, p.pos.y - playerPos.y);
            if (dist < 20 + p.radius) {
                // Pre-calculated damage from enemy, with multiplicative level scaling
                const baseDmg = p.damage ?? 10;
                const dmg = baseDmg * (1 + (p.level || 1) * 0.05);

                triggerPlayerHit(time, dmg, p as unknown as Entity);

                // Visual Effect for Homing Missile Impact
                if (p.weaponType === WeaponType.MISSILE) {
                    spawnExplosion(p.pos, 80, '#f97316');
                }

                p.isAlive = false;
                p.health = 0;
            }
        }

        // 4b. Enemy Lasers vs Player (Beam Collision)
        enemies.forEach(e => {
            const enemyType = e.enemyType;
            if ((enemyType === EnemyType.LASER_SCOUT || enemyType === EnemyType.BOSS_DREADNOUGHT) && e.isFiring) {
                const angle = e.angle || 0;
                const isBoss = enemyType === EnemyType.BOSS_DREADNOUGHT;

                // Beam Properties
                const len = isBoss ? 1600 : 1200;
                const baseWidth = isBoss ? 90 : 40;
                const progress = e.chargeProgress || 0;
                const width = Math.max(20, baseWidth * (1 - progress * 0.3));

                const startX = e.pos.x;
                const startY = e.pos.y;
                const endX = startX + Math.cos(angle) * len;
                const endY = startY + Math.sin(angle) * len;

                const distSq = distToSegmentSq(playerPos, { x: startX, y: startY }, { x: endX, y: endY });

                // Player radius approx 20
                if (distSq < (width / 2 + 20) ** 2) {
                    // Get beam damage from definition and apply damageMult + multiplicative level scaling
                    const baseDmg = getEnemyDefinition(e.enemyType).attacks?.beam ?? (isBoss ? 20 : 12);
                    const lvl = e.level || 1;
                    const dmg = baseDmg * e.damageMult * (1 + lvl * (isBoss ? 0.03 : 0.02));

                    triggerPlayerHit(time, dmg, isBoss ? "Dreadnought Beam" : "Sniper Beam");
                }
            }
        });

        // 5. Pickup Collection
        let xpGained = 0;
        let creditsGained = 0;

        for (const p of pickups) {
            const dist = Math.hypot(p.pos.x - playerPos.x, p.pos.y - playerPos.y);
            if (dist < 40) { // Collection range
                // Apply Effect
                if (p.type === EntityType.XP_GEM) {
                    xpGained += (p.value || 1);
                } else if (p.type === EntityType.CREDIT) {
                    creditsGained += Math.floor((p.value || 0) * pStats.creditMultiplier);
                } else if (p.type === EntityType.POWERUP && p.powerUpId) {
                    const config = POWER_UPS[p.powerUpId];
                    if (config) {
                        setStats(prev => config.onPickup(prev, time));
                    }
                }
                p.health = 0; // Pickups use health=0 to die
            }
        }

        if (creditsGained > 0) {
            setStats(prev => ({ ...prev, credits: prev.credits + creditsGained }));
            onCreditCollected(creditsGained);
        }

        if (xpGained > 0) {
            setStats(prev => {
                let newXp = prev.xp + xpGained;
                let newLevel = prev.level;
                let newXpToNext = prev.xpToNextLevel;
                let actualLevelsGained = 0;

                while (newXp >= newXpToNext) {
                    newXp -= newXpToNext;
                    newLevel++;
                    newXpToNext = Math.floor(newXpToNext * 1.2);
                    actualLevelsGained++;
                }

                return {
                    ...prev,
                    xp: newXp,
                    level: newLevel,
                    xpToNextLevel: newXpToNext,
                    pendingLevelUps: prev.pendingLevelUps + actualLevelsGained
                };
            });
        }

        // 6. Death Logic
        enemies.forEach(e => {
            if (e.health <= 0) {
                // Ensure we haven't already processed death (optional check if e.isAlive)
                // But health <= 0 is the trigger.
                onEnemyKilled(); // Track Stats
                const scoreAdd = spawnDrops(e);
                setScore(s => s + scoreAdd);
                spawnExplosion(e.pos, e.radius * 2.5, e.color); // BOOM!

                // Kamikaze Explosion Damage to Player
                if (e.enemyType === EnemyType.KAMIKAZE) {
                    const dist = Math.hypot(e.pos.x - playerPos.x, e.pos.y - playerPos.y);
                    const blastRadius = 120;
                    if (dist < blastRadius) {
                        // Get explosion damage from definition and apply damageMult
                        const baseDmg = getEnemyDefinition(e.enemyType).attacks?.explosion ?? 40;
                        const blastDmg = baseDmg * e.damageMult * (1 + (e.level || 1) * 0.1);
                        triggerPlayerHit(time, blastDmg, "Kamikaze Blast");
                    }
                    spawnExplosion(e.pos, 100, '#f97316');
                }
            }
        });

    }, [gridRef, onCreditCollected, onEnemyHit, onEnemyKilled, triggerPlayerHit, spawnDrops, spawnDamageText, spawnExplosion, setScore, setStats, setOfferedUpgrades, persistentData]);

    return { checkCollisions };
};
