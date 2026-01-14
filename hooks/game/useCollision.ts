
import { useCallback, useRef, useEffect } from 'react';
import { Entity, EntityType, PlayerStats, WeaponType, PersistentData, Upgrade, GameState } from '../../types';
import { UPGRADES } from '../../constants';
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

        // 1. Projectiles vs Enemies (Optimized O(N * K))
        for (let i = 0; i < projectiles.length; i++) {
            const p = projectiles[i];
            
            // Skip dead or special projectiles early
            if (p.type !== EntityType.BULLET || p.isCharging || p.health <= 0) continue;

            // Retrieve only nearby candidates
            const candidates = grid.retrieve(p);

            for (let j = 0; j < candidates.length; j++) {
                const e = candidates[j];
                
                // Double check health (redundant but safe)
                if (e.health <= 0) continue;

                if (checkCircleCollision(p, e)) {
                     // --- DAMAGE CALCULATION ---
                     const isCrit = Math.random() < pStats.critChance;
                     let baseDamage = pStats.damage;
                     if (isCrit) baseDamage *= pStats.critMultiplier;
                     
                     let damage = baseDamage;
                     let isShieldHit = false;

                     // Shield Logic
                     if (e.shield && e.shield > 0) {
                         const shieldHit = Math.min(e.shield, damage);
                         e.shield -= shieldHit;
                         damage -= shieldHit;
                         e.lastShieldHitTime = time;
                         isShieldHit = true;
                     }

                     // Hull Logic
                     if (damage > 0) e.health -= damage;
                     
                     e.lastHitTime = time;
                     spawnDamageText(e.pos, baseDamage, isCrit ? '#facc15' : (isShieldHit && damage <= 0 ? '#06fdfd' : '#ffffff'));

                     // --- WEAPON EFFECTS ---
                     if (p.weaponType === WeaponType.PLASMA) {
                         // Plasma Slow Effect
                         e.slowUntil = time + 2000;
                         e.slowFactor = 0.3; 
                     }

                     if (e.health <= 0) {
                         const scoreGain = spawnDrops(e);
                         setScore(s => s + scoreGain);
                     }

                     // --- PROJECTILE CONSUMPTION ---
                     if (p.weaponType === WeaponType.MISSILE) {
                         p.health = 0; 
                         const mRad = 110 * (1 + (persistentData.metaLevels['meta_msl_rad'] || 0) * 0.3);
                         
                         // Area Damage with Falloff
                         // Note: We use addParticles but we might want to pool explosions in the future too
                         addParticles([{
                             id: Math.random().toString(36), type: EntityType.EXPLOSION, pos: { ...p.pos },
                             vel: { x: 0, y: 0 }, radius: mRad, health: 1, maxHealth: 1, color: '#fb923c',
                             duration: 0, maxDuration: 0.6
                         }]);
                         
                         // For AOE, we still iterate candidates or nearby. 
                         // To be perfectly accurate, AOE should check grid again with larger radius
                         // But reusing candidates is a "good enough" approximation if radius isn't huge compared to cell.
                         // Or we can just iterate 'enemies' for AOE since it happens rarely (Missiles have slow fire rate)
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
                         // Plasma/Laser
                         if (p.pierceCount && p.pierceCount > 1) {
                             p.pierceCount--;
                         } else {
                             p.health = 0; 
                         }
                     }
                     break; // Hit one enemy per frame per bullet check (unless piercing handled logic above continues, but `break` here stops checking other candidates for THIS bullet instance)
                }
            }
        }

        // 2. Enemy Attacks vs Player (Iterate all active enemies)
        if (!isInvulnerable) {
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (e.health <= 0) continue;
                
                // Melee
                if (e.isMelee) {
                    const dist = Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y);
                    if (dist < e.radius + 20) {
                        if (time - (e.lastMeleeHitTime || 0) > 500) {
                            e.lastMeleeHitTime = time;
                            triggerPlayerHit(time, 15 + (e.level || 1) * 4);
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
                            triggerPlayerHit(time, 12 + (e.level || 1) * 3);
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
