
import React, { useCallback, useRef, useEffect } from 'react';
import { Entity, EntityType, PlayerStats, WeaponType, PersistentData, Upgrade, GameState } from '../../types';
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
const distToSegmentSq = (p: {x:number, y:number}, v: {x:number, y:number}, w: {x:number, y:number}) => {
    const l2 = (w.x - v.x)*(w.x - v.x) + (w.y - v.y)*(w.y - v.y);
    if (l2 === 0) return (p.x - v.x)*(p.x - v.x) + (p.y - v.y)*(p.y - v.y);
    
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    
    const px = v.x + t * (w.x - v.x);
    const py = v.y + t * (w.y - v.y);
    
    return (p.x - px)*(p.x - px) + (p.y - py)*(p.y - py);
};

// Fix: Use React namespace correctly by importing React
export const useCollision = (
    enemiesRef: React.MutableRefObject<Entity[]>,
    projectilesRef: React.MutableRefObject<Entity[]>,
    pickupsRef: React.MutableRefObject<Entity[]>,
    playerPosRef: React.MutableRefObject<{ x: number, y: number }>,
    statsRef: React.MutableRefObject<PlayerStats>,
    triggerPlayerHit: (time: number, damage: number) => void,
    spawnDrops: (enemy: Entity) => number, 
    spawnDamageText: (pos: { x: number, y: number }, damage: number, color?: string) => void,
    addParticles: (particles: Entity[]) => void,
    setScore: React.Dispatch<React.SetStateAction<number>>,
    setStats: React.Dispatch<React.SetStateAction<PlayerStats>>,
    setOfferedUpgrades: (u: Upgrade[]) => void,
    setGameState: (s: GameState) => void,
    persistentData: PersistentData
) => {
    // Persistent Spatial Grid
    const gridRef = useRef<SpatialHashGrid>(new SpatialHashGrid());

    const checkCollisions = useCallback((time: number, dt: number) => {
        const pStats = statsRef.current;
        const enemies = enemiesRef.current;
        const projectiles = projectilesRef.current;
        const pickups = pickupsRef.current;
        const isInvulnerable = time < pStats.invulnerableUntil;
        const grid = gridRef.current;

        // 0. Update Spatial Grid (Insert Enemies)
        // O(M) operation, very fast
        grid.clear();
        for (let i = 0; i < enemies.length; i++) {
            if (enemies[i].health > 0) {
                grid.insert(enemies[i]);
            }
        }

        // 1. Projectiles vs Enemies
        for (let i = 0; i < projectiles.length; i++) {
            const p = projectiles[i];
            if (p.health <= 0) continue;

            // --- LASER BEAM LOGIC (Line vs Circle) ---
            if (p.weaponType === WeaponType.LASER) {
                // Only deal damage if in Firing state
                if (p.isFiring) {
                    // Prevent multi-hit per beam tick if we want strict DPS, 
                    // but for "Instant Hit", we can just check if we haven't hit this enemy with THIS beam instance yet.
                    // However, simplified: apply damage every frame it is overlapping.
                    // To prevent crazy damage, we use a cooldown per enemy for being hit by specific weapon types if needed,
                    // OR rely on the short duration of the beam (0.3s) and frame rate.
                    // Let's use a `lastHitTime` check on enemy for Laser specifically to throttle it slightly or just let it rip.
                    // Given the user said "Instantly damages", implying one big hit.
                    // We can use a property on the beam `hasDealtDamage` or similar, but the beam persists for visuals.
                    
                    // Let's implement: Damage applied ONCE per beam fire instance.
                    // We can store hit enemies in a Set on the projectile? 
                    // Since Entity doesn't have a Set, we'll check `p.duration` (if it's the first frame of firing).
                    
                    if ((p.duration || 0) <= dt * 1.5) { // First frame(s) only
                        const angle = p.angle || 0;
                        const beamLen = LASER_LENGTH; // Use constant
                        const beamStart = p.pos;
                        const beamEnd = {
                            x: beamStart.x + Math.cos(angle) * beamLen,
                            y: beamStart.y + Math.sin(angle) * beamLen
                        };

                        // Check ALL enemies for beam (Grid is acceptable, but Line traverses many cells. 
                        // Iterating all active enemies is safer/easier for infinite lines).
                        for (let j = 0; j < enemies.length; j++) {
                            const e = enemies[j];
                            if (e.health <= 0) continue;

                            const distSq = distToSegmentSq(e.pos, beamStart, beamEnd);
                            const hitRadius = e.radius + 30; // Beam width allowance
                            
                            if (distSq < hitRadius * hitRadius) {
                                // HIT!
                                const isCrit = Math.random() < pStats.critChance;
                                let baseDamage = pStats.damage;
                                if (isCrit) baseDamage *= pStats.critMultiplier;
                                
                                let damage = baseDamage;
                                let isShieldHit = false;

                                if (e.shield && e.shield > 0) {
                                    const shieldHit = Math.min(e.shield, damage);
                                    e.shield -= shieldHit;
                                    damage -= shieldHit;
                                    e.lastShieldHitTime = time;
                                    isShieldHit = true;
                                }

                                if (damage > 0) e.health -= damage;
                                e.lastHitTime = time;
                                spawnDamageText(e.pos, Math.floor(baseDamage), isCrit ? '#facc15' : '#a855f7');

                                if (e.health <= 0) {
                                    const scoreGain = spawnDrops(e);
                                    setScore(s => s + scoreGain);
                                }
                            }
                        }
                    }
                }
                continue; // Skip standard collision logic for Laser
            }

            // --- STANDARD PROJECTILE LOGIC (Circle vs Circle) ---
            if (p.type !== EntityType.BULLET) continue;

            const candidates = grid.retrieve(p);

            for (let j = 0; j < candidates.length; j++) {
                const e = candidates[j];
                if (e.health <= 0) continue;

                if (checkCircleCollision(p, e)) {
                     const isCrit = Math.random() < pStats.critChance;
                     let baseDamage = pStats.damage;
                     if (isCrit) baseDamage *= pStats.critMultiplier;
                     
                     let damage = baseDamage;
                     let isShieldHit = false;

                     if (e.shield && e.shield > 0) {
                         const shieldHit = Math.min(e.shield, damage);
                         e.shield -= shieldHit;
                         damage -= shieldHit;
                         e.lastShieldHitTime = time;
                         isShieldHit = true;
                     }

                     if (damage > 0) e.health -= damage;
                     e.lastHitTime = time;
                     spawnDamageText(e.pos, baseDamage, isCrit ? '#facc15' : (isShieldHit && damage <= 0 ? '#06fdfd' : '#ffffff'));

                     if (p.weaponType === WeaponType.PLASMA) {
                         e.slowUntil = time + 2000;
                         e.slowFactor = 0.3; 
                     }

                     if (e.health <= 0) {
                         const scoreGain = spawnDrops(e);
                         setScore(s => s + scoreGain);
                     }

                     if (p.weaponType === WeaponType.MISSILE) {
                         p.health = 0; 
                         const mRad = 110 * (1 + (persistentData.metaLevels['meta_msl_rad'] || 0) * 0.3);
                         addParticles([{
                             id: Math.random().toString(36), type: EntityType.EXPLOSION, pos: { ...p.pos },
                             vel: { x: 0, y: 0 }, radius: mRad, health: 1, maxHealth: 1, color: '#fb923c',
                             duration: 0, maxDuration: 0.6
                         }]);
                         enemies.forEach(other => {
                             if (other.id !== e.id && other.health > 0) {
                                 const dist = Math.hypot(other.pos.x - p.pos.x, other.pos.y - p.pos.y);
                                 if (dist < mRad) {
                                     const falloff = 1 - (dist / mRad);
                                     const finalScale = 0.25 + (falloff * 0.75);
                                     let aoeDmg = pStats.damage * 0.8 * finalScale;
                                     if (other.shield && other.shield > 0) {
                                         const sd = Math.min(other.shield, aoeDmg);
                                         other.shield -= sd;
                                         aoeDmg -= sd;
                                         other.lastShieldHitTime = time;
                                     }
                                     if (aoeDmg > 0) other.health -= aoeDmg;
                                     other.lastHitTime = time;
                                     spawnDamageText(other.pos, Math.floor(aoeDmg), '#fb923c');
                                     if (other.health <= 0) {
                                         const sg = spawnDrops(other);
                                         setScore(s => s + sg);
                                     }
                                 }
                             }
                         });
                     } else {
                         if (p.pierceCount && p.pierceCount > 1) {
                             p.pierceCount--;
                         } else {
                             p.health = 0; 
                         }
                     }
                     break; 
                }
            }
        }

        // 2. Enemy Attacks vs Player (Iterate all active enemies)
        if (!isInvulnerable) {
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (e.health <= 0) continue;
                
                // Melee (Strikers / Scouts)
                if (e.isMelee || e.type === EntityType.ENEMY_SCOUT || e.isMiniboss) {
                    const dist = Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y);
                    if (dist < e.radius + 20) {
                        if (time - (e.lastMeleeHitTime || 0) > 500) {
                            e.lastMeleeHitTime = time;
                            
                            let baseHit = 15 + (e.level || 1) * 4;
                            if (e.isMiniboss) baseHit *= 3; // Miniboss hits like a truck
                            else if (e.isElite) baseHit *= 1.5;

                            triggerPlayerHit(time, baseHit);
                        }
                    }
                }
                
                // Laser Beam
                if (e.type === EntityType.ENEMY_LASER_SCOUT && e.isFiring) {
                    const dx = playerPosRef.current.x - e.pos.x;
                    const dy = playerPosRef.current.y - e.pos.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist < 800) {
                        const playerAngle = Math.atan2(dy, dx);
                        const beamAngle = e.angle || 0;
                        const angleDiff = Math.abs(Math.atan2(Math.sin(beamAngle - playerAngle), Math.cos(beamAngle - playerAngle)));
                        
                        if (angleDiff < 0.15) {
                            let beamDmg = 12 + (e.level || 1) * 3;
                            if (e.isMiniboss) beamDmg *= 2.5;
                            else if (e.isElite) beamDmg *= 1.5;

                            triggerPlayerHit(time, beamDmg);
                        }
                    }
                }
            }

            // Enemy Bullets vs Player
            for (let i = 0; i < projectiles.length; i++) {
                const p = projectiles[i];
                if (p.type === EntityType.ENEMY_BULLET && p.health > 0) {
                    const dist = Math.hypot(p.pos.x - playerPosRef.current.x, p.pos.y - playerPosRef.current.y);
                    if (dist < 22 + p.radius) { 
                        p.health = 0;
                        triggerPlayerHit(time, 10 + (p.level || 1) * 2.5);
                    }
                }
            }
        }

        // 4. Pickups vs Player
        for (let i = 0; i < pickups.length; i++) {
            const p = pickups[i];
            if (p.health <= 0) continue; 
            const dist = Math.hypot(p.pos.x - playerPosRef.current.x, p.pos.y - playerPosRef.current.y);
            if (dist < 50) {
                p.health = 0; 
                
                if (p.type === EntityType.POWERUP && p.powerUpId) {
                    const config = POWER_UPS[p.powerUpId];
                    if (config) {
                        setStats(st => config.onPickup(st, time));
                        spawnDamageText(playerPosRef.current, 0, config.color);
                    }
                } else if (p.type === EntityType.XP_GEM) {
                    setStats(st => {
                        const nx = st.xp + (p.value || 0);
                        if (nx >= st.xpToNextLevel) {
                            setTimeout(() => {
                                setOfferedUpgrades([...UPGRADES].sort(() => 0.5 - Math.random()).slice(0, 3));
                                setGameState(GameState.LEVELING);
                            }, 0);
                            return { ...st, xp: 0, level: st.level + 1, xpToNextLevel: Math.floor(250 * Math.pow(st.level + 1, 1.5)) };
                        }
                        return { ...st, xp: nx };
                    });
                } else if (p.type === EntityType.CREDIT) {
                    const val = (p.value || 0) * pStats.creditMultiplier;
                    setStats(st => ({ ...st, credits: st.credits + val }));
                } 
            }
        }

    }, [enemiesRef, projectilesRef, pickupsRef, playerPosRef, statsRef, triggerPlayerHit, spawnDrops, spawnDamageText, addParticles, setScore, setStats, setOfferedUpgrades, setGameState, persistentData]);

    return { checkCollisions };
};
