
import React, { useRef, useCallback, useState } from 'react';
import { Entity, EntityType, Vector2D, WeaponType, PlayerStats } from '../../types';
import { TARGETING_RADIUS, BULLET_MAX_DIST } from '../../constants';
import { ObjectPool, createEntity } from '../../systems/ObjectPool';

export const useProjectiles = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    statsRef: React.MutableRefObject<PlayerStats>,
    onShotFired: () => void
) => {
    const projectilesRef = useRef<Entity[]>([]);
    const lastFireTimeRef = useRef(0);
    const [autoAttack, setAutoAttack] = useState(true);

    // Burst Logic State
    const burstQueueRef = useRef({
        count: 0,
        nextShotTime: 0,
        angle: 0,
        hasTarget: false
    });

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
            e.targetId = undefined; // Reset Target
            e.isHoming = false; // Reset Homing
            e.turnRate = 0;
        })
    );

    const initProjectiles = useCallback(() => {
        // Return all current projectiles to pool
        const pool = poolRef.current;
        projectilesRef.current.forEach(p => pool.release(p));
        projectilesRef.current.length = 0;
        lastFireTimeRef.current = 0;
        burstQueueRef.current = { count: 0, nextShotTime: 0, angle: 0, hasTarget: false };
    }, []);

    const fireWeapon = useCallback((time: number, isOverdrive: boolean, isOmni: boolean, isPierce: boolean, targets: Entity[], aimDir: Vector2D, triggerActive: boolean) => {
        const pStats = statsRef.current;
        const fr = isOverdrive ? pStats.fireRate * 2.5 : pStats.fireRate;

        // Manual aim magnitude check
        const isManualAim = Math.abs(aimDir.x) > 0.1 || Math.abs(aimDir.y) > 0.1;
        
        // Firing Condition:
        // 1. Manual Aim is active AND Trigger is held (Key/Mouse/Stick)
        // 2. OR AutoAttack is enabled AND no manual aim AND enemies nearby
        // NOTE: For SWARM_LAUNCHER, "nearby" might be wider, but sticking to standard targeting radius is fine.
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
                    // Auto-aim active but no target in range: Do NOT fire.
                    hasTarget = false;
                }
            }

            if (hasTarget) {
                // If SWARM LAUNCHER, do not fire immediately. Queue the Burst.
                if (pStats.weaponType === WeaponType.SWARM_LAUNCHER) {
                    // Prevent queueing if already firing
                    if (burstQueueRef.current.count > 0) return;

                    burstQueueRef.current.count = pStats.swarmCount;
                    burstQueueRef.current.nextShotTime = time; // Fire first immediately in loop
                    burstQueueRef.current.angle = fireAngle;
                    burstQueueRef.current.hasTarget = true;
                    // NOTE: We do NOT set lastFireTimeRef here. 
                    // We set it only when the burst finishes in updateProjectiles.
                    return; 
                }

                lastFireTimeRef.current = time;
                onShotFired(); // Track stats for immediate weapons
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
    }, [autoAttack, playerPosRef, statsRef, onShotFired]);

    const updateProjectiles = useCallback((dt: number, time: number, targets: Entity[], aimDir: Vector2D) => {
        const pStats = statsRef.current;
        const pool = poolRef.current;
        const newExplosions: { pos: Vector2D, radius: number, color: string }[] = [];
        
        // --- BURST PROCESSING (Swarm Launcher) ---
        if (burstQueueRef.current.count > 0 && time >= burstQueueRef.current.nextShotTime) {
             const angle = burstQueueRef.current.angle;
             const p = pool.get();
             p.id = Math.random().toString(36);
             p.type = EntityType.BULLET;
             p.pos.x = playerPosRef.current.x; p.pos.y = playerPosRef.current.y;
             
             // Swarm starts slower then accelerates? No, let's just use steering.
             // Start moving in fire direction
             const speed = pStats.bulletSpeed;
             p.vel.x = Math.cos(angle) * speed;
             p.vel.y = Math.sin(angle) * speed;
             
             p.radius = 10;
             p.color = '#e879f9'; // Pink/Purple for swarm
             p.weaponType = WeaponType.SWARM_LAUNCHER;
             p.pierceCount = 1;
             p.duration = 0; // Ensure reset
             
             // Assign a target if available
             // Find nearest valid target at spawn moment for homing
             let nearest: Entity | null = null;
             let minDist = 800;
             targets.forEach(t => {
                 const d = Math.hypot(t.pos.x - p.pos.x, t.pos.y - p.pos.y);
                 if (d < minDist) { minDist = d; nearest = t; }
             });
             if (nearest) p.targetId = nearest.id;

             projectilesRef.current.push(p);
             onShotFired();

             burstQueueRef.current.count--;
             if (burstQueueRef.current.count <= 0) {
                 // Burst Finished: Start the reload timer NOW
                 lastFireTimeRef.current = time;
             } else {
                 burstQueueRef.current.nextShotTime = time + 120; // 120ms between burst shots
             }
        }
        
        // Iterate BACKWARDS to allow safe swap-remove
        const projs = projectilesRef.current;
        
        for (let i = projs.length - 1; i >= 0; i--) {
            const e = projs[i];
            let alive = e.health > 0;

            if (alive) {
                if (e.type === EntityType.BULLET) {
                    
                    if (e.weaponType === WeaponType.LASER) {
                         // ... (Laser Logic Same as Before) ...
                         e.pos.x = playerPosRef.current.x;
                         e.pos.y = playerPosRef.current.y;

                         let targetAngle = e.angle || 0;
                         if (Math.abs(aimDir.x) > 0.1 || Math.abs(aimDir.y) > 0.1) {
                             targetAngle = Math.atan2(aimDir.y, aimDir.x);
                         } else if (targets.length > 0 && autoAttack) {
                             let nearest: Entity | null = null;
                             let minDist = TARGETING_RADIUS;
                             targets.forEach(t => {
                                 const d = Math.hypot(t.pos.x - playerPosRef.current.x, t.pos.y - playerPosRef.current.y);
                                 if (d < minDist) { minDist = d; nearest = t; }
                             });
                             if (nearest) {
                                 targetAngle = Math.atan2(nearest.pos.y - playerPosRef.current.y, nearest.pos.x - playerPosRef.current.x);
                             }
                         }

                         let currentAngle = e.angle || 0;
                         let angleDiff = targetAngle - currentAngle;
                         while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                         while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                         const turnSpeed = e.isFiring ? 3.0 : 8.0; 
                         const step = turnSpeed * dt;
                         if (Math.abs(angleDiff) < step) {
                             e.angle = targetAngle;
                         } else {
                             e.angle = currentAngle + Math.sign(angleDiff) * step;
                         }

                         if (e.isCharging) {
                             e.chargeProgress = (e.chargeProgress || 0) + dt * 1.0; 
                             if (e.chargeProgress >= 1.0) { e.isCharging = false; e.isFiring = true; e.duration = 0; }
                         } else if (e.isFiring) {
                             e.duration = (e.duration || 0) + dt;
                             if (e.duration > pStats.laserDuration) alive = false;
                         }

                    } else if (e.weaponType === WeaponType.SWARM_LAUNCHER) {
                        // --- HOMING MISSILE STEERING ---
                        // Lifetime check (3.0 seconds max)
                        e.duration = (e.duration || 0) + dt;
                        if (e.duration > 3.0) {
                            alive = false;
                            // Visual Explosion on timeout
                            newExplosions.push({ pos: e.pos, radius: 150, color: '#e879f9' }); // 80 -> 150
                        }

                        if (alive) {
                            // 1. Find or Maintain Target
                            let target: Entity | undefined;
                            if (e.targetId) {
                                target = targets.find(t => t.id === e.targetId);
                            }
                            
                            // If target lost/dead, find new one
                            if (!target || target.health <= 0) {
                                let nearest: Entity | null = null;
                                let minDist = 600;
                                targets.forEach(t => {
                                    const d = Math.hypot(t.pos.x - e.pos.x, t.pos.y - e.pos.y);
                                    if (d < minDist) { minDist = d; nearest = t; }
                                });
                                if (nearest) {
                                    e.targetId = nearest.id;
                                    target = nearest;
                                } else {
                                    e.targetId = undefined; // No target, fly straight
                                }
                            }

                            // 2. Steer towards target
                            const speed = pStats.bulletSpeed; // Current speed stat
                            const agility = pStats.swarmAgility || 1.5; // Rad/sec

                            let currentAngle = Math.atan2(e.vel.y, e.vel.x);

                            if (target) {
                                const dx = target.pos.x - e.pos.x;
                                const dy = target.pos.y - e.pos.y;
                                const targetAngle = Math.atan2(dy, dx);
                                
                                let diff = targetAngle - currentAngle;
                                while (diff > Math.PI) diff -= Math.PI * 2;
                                while (diff < -Math.PI) diff += Math.PI * 2;
                                
                                const turnStep = agility * dt;
                                if (Math.abs(diff) < turnStep) {
                                    currentAngle = targetAngle;
                                } else {
                                    currentAngle += Math.sign(diff) * turnStep;
                                }
                            }

                            // Apply Velocity
                            e.vel.x = Math.cos(currentAngle) * speed;
                            e.vel.y = Math.sin(currentAngle) * speed;
                            
                            e.pos.x += e.vel.x * dt;
                            e.pos.y += e.vel.y * dt;
                        }

                    } else {
                        // Standard Bullets (Plasma / Missile)
                        e.pos.x += e.vel.x * dt;
                        e.pos.y += e.vel.y * dt;

                        const maxDist = BULLET_MAX_DIST;
                        const dx = e.pos.x - playerPosRef.current.x;
                        const dy = e.pos.y - playerPosRef.current.y;
                        if (dx*dx + dy*dy > maxDist*maxDist) {
                            alive = false;
                        }
                    }

                } else if (e.type === EntityType.ENEMY_BULLET) {
                    // Check for Homing Capability
                    if (e.isHoming) {
                        const targetX = playerPosRef.current.x;
                        const targetY = playerPosRef.current.y;
                        const dx = targetX - e.pos.x;
                        const dy = targetY - e.pos.y;
                        const targetAngle = Math.atan2(dy, dx);
                        
                        let currentAngle = Math.atan2(e.vel.y, e.vel.x);
                        let diff = targetAngle - currentAngle;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        
                        const turnRate = e.turnRate || 1.0;
                        const turnStep = turnRate * dt;
                        
                        if (Math.abs(diff) < turnStep) {
                            currentAngle = targetAngle;
                        } else {
                            currentAngle += Math.sign(diff) * turnStep;
                        }
                        
                        // Missile acceleration or constant speed?
                        const speed = Math.hypot(e.vel.x, e.vel.y) * 1.01; // Slight acceleration
                        const maxSpeed = 350;
                        const finalSpeed = Math.min(speed, maxSpeed);
                        
                        e.vel.x = Math.cos(currentAngle) * finalSpeed;
                        e.vel.y = Math.sin(currentAngle) * finalSpeed;
                    }

                    e.pos.x += e.vel.x * dt;
                    e.pos.y += e.vel.y * dt;
                    
                    const dx = e.pos.x - playerPosRef.current.x;
                    const dy = e.pos.y - playerPosRef.current.y;
                    // Extended range for boss missiles
                    const range = e.isHoming ? 2000 : BULLET_MAX_DIST; 
                    if (dx*dx + dy*dy > range*range) {
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

        return { newExplosions };
    }, [playerPosRef, statsRef, autoAttack, onShotFired]);

    const addProjectiles = useCallback((newProjs: Entity[]) => {
        projectilesRef.current.push(...newProjs);
    }, []);

    return { projectilesRef, autoAttack, setAutoAttack, initProjectiles, fireWeapon, updateProjectiles, addProjectiles };
};
