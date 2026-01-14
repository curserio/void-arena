
import { useRef, useCallback, useState } from 'react';
import { Entity, EntityType, Vector2D, WeaponType, PlayerStats } from '../../types';
import { TARGETING_RADIUS, BULLET_MAX_DIST } from '../../constants';
import { ObjectPool, createEntity } from '../../systems/ObjectPool';

export const useProjectiles = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    statsRef: React.MutableRefObject<PlayerStats>
) => {
    const projectilesRef = useRef<Entity[]>([]);
    const lastFireTimeRef = useRef(0);
    const [autoAttack, setAutoAttack] = useState(true);

    // Initialize Pool
    const poolRef = useRef<ObjectPool<Entity>>(
        new ObjectPool<Entity>(createEntity, (e) => {
            // Reset logic
            e.health = 1;
            e.maxHealth = 1;
            e.isCharging = false;
            e.chargeProgress = 0;
            e.isFiring = false;
            e.angle = 0;
            e.pierceCount = 1;
            e.duration = 0;
        })
    );

    const initProjectiles = useCallback(() => {
        // Return all current projectiles to pool
        const pool = poolRef.current;
        projectilesRef.current.forEach(p => pool.release(p));
        projectilesRef.current.length = 0;
        lastFireTimeRef.current = 0;
    }, []);

    const fireWeapon = useCallback((time: number, isOverdrive: boolean, isOmni: boolean, isPierce: boolean, targets: Entity[], aimDir: Vector2D, triggerActive: boolean) => {
        const pStats = statsRef.current;
        const fr = isOverdrive ? pStats.fireRate * 2.5 : pStats.fireRate;

        // Manual aim magnitude check
        const isManualAim = Math.abs(aimDir.x) > 0.1 || Math.abs(aimDir.y) > 0.1;
        
        // Firing Condition:
        // 1. Manual Aim is active AND Trigger is held (Key/Mouse/Stick)
        // 2. OR AutoAttack is enabled AND no manual aim AND enemies nearby
        const shouldFire = (isManualAim && triggerActive) || (autoAttack && !isManualAim && targets.length > 0);

        if (shouldFire && (time - lastFireTimeRef.current > 1000 / fr)) {
            // Check if we already have an active laser for this player, if so, wait (prevent stacking beams)
            if (pStats.weaponType === WeaponType.LASER) {
                 const hasActiveLaser = projectilesRef.current.some(p => p.weaponType === WeaponType.LASER && p.type === EntityType.BULLET);
                 if (hasActiveLaser) return;
            }

            let fireAngle = 0;
            let hasTarget = false;

            if (isManualAim) {
                // Manual Aim Direction
                fireAngle = Math.atan2(aimDir.y, aimDir.x);
                hasTarget = true;
            } else {
                // Auto-Aim Logic (Nearest Neighbor)
                let nearest: Entity | null = null;
                let minDist = TARGETING_RADIUS;

                targets.forEach(e => {
                    const d = Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y);
                    if (d < minDist) { minDist = d; nearest = e; }
                });

                if (nearest) {
                    const n = nearest as Entity;
                    fireAngle = Math.atan2(n.pos.y - playerPosRef.current.y, n.pos.x - playerPosRef.current.x);
                    hasTarget = true;
                } else {
                    // Default to facing movement direction or UP if standing still
                    fireAngle = -Math.PI / 2;
                    hasTarget = true; // Allow firing blindly if trigger is held (mostly for testing or prep)
                }
            }

            if (hasTarget) {
                lastFireTimeRef.current = time;
                const pool = poolRef.current;

                if (pStats.weaponType === WeaponType.LASER) {
                    // LASER: Spawn one beam entity attached to player
                    const p = pool.get();
                    p.id = Math.random().toString(36);
                    p.type = EntityType.BULLET;
                    p.pos.x = playerPosRef.current.x; 
                    p.pos.y = playerPosRef.current.y;
                    p.vel.x = 0; p.vel.y = 0; // Moves with player
                    p.radius = 20;
                    p.color = '#a855f7';
                    p.weaponType = WeaponType.LASER;
                    p.isCharging = true;
                    p.chargeProgress = 0;
                    p.angle = fireAngle;
                    p.pierceCount = 999; // Lasers pierce everything

                    projectilesRef.current.push(p);

                } else {
                    // Standard Projectiles (Plasma / Missile)
                    const angles = isOmni ? [-0.3, 0, 0.3] : [0];

                    angles.forEach(spreadAngle => {
                        const currentAngle = fireAngle + spreadAngle;
                        if (pStats.weaponType === WeaponType.PLASMA) {
                            const spacing = 15;
                            const startOffset = -(pStats.bulletCount - 1) * spacing / 2;
                            for (let i = 0; i < pStats.bulletCount; i++) {
                                const offset = startOffset + i * spacing;
                                const px = playerPosRef.current.x + Math.cos(currentAngle + Math.PI / 2) * offset;
                                const py = playerPosRef.current.y + Math.sin(currentAngle + Math.PI / 2) * offset;
                                
                                const p = pool.get();
                                p.id = Math.random().toString(36); 
                                p.type = EntityType.BULLET;
                                p.pos.x = px; p.pos.y = py;
                                p.vel.x = Math.cos(currentAngle) * pStats.bulletSpeed;
                                p.vel.y = Math.sin(currentAngle) * pStats.bulletSpeed;
                                p.radius = 8;
                                p.color = '#22d3ee';
                                p.pierceCount = isPierce ? 99 : 1;
                                p.weaponType = WeaponType.PLASMA;
                                
                                projectilesRef.current.push(p);
                            }
                        } else if (pStats.weaponType === WeaponType.MISSILE) {
                            const p = pool.get();
                            p.id = Math.random().toString(36);
                            p.type = EntityType.BULLET;
                            p.pos.x = playerPosRef.current.x; p.pos.y = playerPosRef.current.y;
                            p.vel.x = Math.cos(currentAngle) * pStats.bulletSpeed;
                            p.vel.y = Math.sin(currentAngle) * pStats.bulletSpeed;
                            p.radius = 14;
                            p.color = '#fb923c';
                            p.weaponType = WeaponType.MISSILE;
                            
                            projectilesRef.current.push(p);
                        }
                    });
                }
            }
        }
    }, [autoAttack, playerPosRef, statsRef]);

    const updateProjectiles = useCallback((dt: number, time: number, targets: Entity[], aimDir: Vector2D) => {
        const pStats = statsRef.current;
        const pool = poolRef.current;
        
        // Iterate BACKWARDS to allow safe swap-remove
        const projs = projectilesRef.current;
        
        for (let i = projs.length - 1; i >= 0; i--) {
            const e = projs[i];
            let alive = e.health > 0;

            if (alive) {
                if (e.type === EntityType.BULLET) {
                    
                    if (e.weaponType === WeaponType.LASER) {
                         // 1. Stick to Player Position
                         e.pos.x = playerPosRef.current.x;
                         e.pos.y = playerPosRef.current.y;

                         // 2. Charging Logic
                         if (e.isCharging) {
                             const chargeSpeed = 1.0; // 1 second charge
                             e.chargeProgress = (e.chargeProgress || 0) + dt * chargeSpeed;

                             // Update aim while charging if player is aiming
                             if (Math.abs(aimDir.x) > 0.1 || Math.abs(aimDir.y) > 0.1) {
                                 e.angle = Math.atan2(aimDir.y, aimDir.x);
                             } else if (targets.length > 0 && autoAttack) {
                                 // Auto-track nearest while charging if no manual input
                                 let nearest: Entity | null = null;
                                 let minDist = TARGETING_RADIUS;
                                 targets.forEach(t => {
                                     const d = Math.hypot(t.pos.x - playerPosRef.current.x, t.pos.y - playerPosRef.current.y);
                                     if (d < minDist) { minDist = d; nearest = t; }
                                 });
                                 if (nearest) {
                                     e.angle = Math.atan2(nearest.pos.y - playerPosRef.current.y, nearest.pos.x - playerPosRef.current.x);
                                 }
                             }

                             if (e.chargeProgress >= 1.0) {
                                 e.isCharging = false;
                                 e.isFiring = true;
                                 e.duration = 0; // Reset duration for firing phase
                             }
                         } 
                         // 3. Firing Logic
                         else if (e.isFiring) {
                             e.duration = (e.duration || 0) + dt;
                             // Beam lasts 0.3s
                             if (e.duration > 0.3) {
                                 alive = false;
                             }
                         }

                    } else {
                        // Standard Bullets (Plasma / Missile)
                        e.pos.x += e.vel.x * dt;
                        e.pos.y += e.vel.y * dt;

                        const maxDist = BULLET_MAX_DIST;
                        // Manual hypot for speed
                        const dx = e.pos.x - playerPosRef.current.x;
                        const dy = e.pos.y - playerPosRef.current.y;
                        if (dx*dx + dy*dy > maxDist*maxDist) {
                            alive = false;
                        }
                    }

                } else if (e.type === EntityType.ENEMY_BULLET) {
                    e.pos.x += e.vel.x * dt;
                    e.pos.y += e.vel.y * dt;
                    const dx = e.pos.x - playerPosRef.current.x;
                    const dy = e.pos.y - playerPosRef.current.y;
                    if (dx*dx + dy*dy > BULLET_MAX_DIST*BULLET_MAX_DIST) {
                        alive = false;
                    }
                }
            }

            if (!alive) {
                // Return to pool and swap-remove
                pool.release(e);
                projs[i] = projs[projs.length - 1];
                projs.pop();
            }
        }

        return { newExplosions: [] };
    }, [playerPosRef, statsRef, autoAttack]);

    const addProjectiles = useCallback((newProjs: Entity[]) => {
        projectilesRef.current.push(...newProjs);
    }, []);

    return { projectilesRef, autoAttack, setAutoAttack, initProjectiles, fireWeapon, updateProjectiles, addProjectiles };
};
