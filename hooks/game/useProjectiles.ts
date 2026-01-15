
import React, { useRef, useCallback, useState } from 'react';
import { Entity, EntityType, Vector2D, WeaponType, PlayerStats } from '../../types';
import { TARGETING_RADIUS } from '../../constants';
// import { ObjectPool, createEntity } from '../../core/utils/ObjectPool'; // Pooling temporarily removed for Class-based refactor
import { IProjectile, ProjectileType, WeaponEffect } from '../../types/projectiles';
import { ProjectileFactory } from '../../core/factories/ProjectileFactory';
import { BaseProjectile } from '../../core/entities/projectiles/BaseProjectile';

export const useProjectiles = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    statsRef: React.MutableRefObject<PlayerStats>,
    onShotFired: () => void
) => {
    // Store IProjectile (BaseProjectile) instead of generic Entity
    const projectilesRef = useRef<BaseProjectile[]>([]);
    const lastFireTimeRef = useRef(0);
    const [autoAttack, setAutoAttack] = useState(true);

    // Burst Logic State
    const burstQueueRef = useRef({
        count: 0,
        nextShotTime: 0,
        angle: 0,
        hasTarget: false
    });

    const initProjectiles = useCallback(() => {
        projectilesRef.current = [];
        lastFireTimeRef.current = 0;
        burstQueueRef.current = { count: 0, nextShotTime: 0, angle: 0, hasTarget: false };
    }, []);

    const fireWeapon = useCallback((time: number, isOverdrive: boolean, isOmni: boolean, isPierce: boolean, targets: Entity[], aimDir: Vector2D, triggerActive: boolean) => {
        const pStats = statsRef.current;
        const fr = isOverdrive ? pStats.fireRate * 2.5 : pStats.fireRate;

        // Manual aim magnitude check
        const isManualAim = Math.abs(aimDir.x) > 0.1 || Math.abs(aimDir.y) > 0.1;

        const shouldFire = (isManualAim && triggerActive) || (autoAttack && !isManualAim && targets.length > 0);

        if (shouldFire && (time - lastFireTimeRef.current > 1000 / fr)) {
            // Check for active laser (prevent stacking)
            if (pStats.weaponType === WeaponType.LASER) {
                const hasActiveLaser = projectilesRef.current.some(p => p.type === ProjectileType.PLAYER_BULLET && p.weaponEffect === WeaponEffect.LASER);
                if (hasActiveLaser) return;
            }

            let fireAngle = 0;
            let hasTarget = false;

            if (isManualAim) {
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
                    hasTarget = false;
                }
            }

            if (hasTarget) {
                // SWARM LAUNCHER BURST LOGIC
                if (pStats.weaponType === WeaponType.SWARM_LAUNCHER) {
                    if (burstQueueRef.current.count > 0) return;

                    burstQueueRef.current.count = pStats.swarmCount;
                    burstQueueRef.current.nextShotTime = time;
                    burstQueueRef.current.angle = fireAngle;
                    burstQueueRef.current.hasTarget = true;
                    return;
                }

                lastFireTimeRef.current = time;
                onShotFired();

                // Stats for Factory
                const baseStats = {
                    damage: pStats.damage,
                    speed: pStats.bulletSpeed,
                    color: pStats.weaponType === WeaponType.MISSILE ? '#fb923c' : (pStats.weaponType === WeaponType.PLASMA ? '#22d3ee' : '#a855f7'),
                    pierce: isPierce ? 99 : pStats.pierceCount,
                    critChance: pStats.critChance,
                    critMult: pStats.critMultiplier,
                    duration: 2000, // Default
                    radius: 8
                };

                if (pStats.weaponType === WeaponType.LASER) {
                    // LASER
                    const p = ProjectileFactory.createPlayerProjectile(
                        { x: playerPosRef.current.x, y: playerPosRef.current.y },
                        { x: 0, y: 0 }, // Direction managed by update for laser
                        // Duration: Give it enough time to charge (e.g. 2s) + fire. We'll truncate it when firing starts.
                        { ...baseStats, radius: 20, pierce: 999, duration: 5000 },
                        time,
                        'player',
                        WeaponEffect.LASER
                    );
                    // Manually set Laser specific props that factory might not expose fully in generic config
                    p.angle = fireAngle;
                    p.isCharging = true;
                    p.chargeProgress = 0;
                    projectilesRef.current.push(p);

                } else {
                    // STANDARD (PLASMA / MISSILE)
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

                                const dir = { x: Math.cos(currentAngle), y: Math.sin(currentAngle) };

                                const p = ProjectileFactory.createPlayerProjectile(
                                    { x: px, y: py },
                                    dir,
                                    { ...baseStats, color: '#22d3ee', radius: 8 },
                                    time
                                );
                                projectilesRef.current.push(p);
                            }
                        } else if (pStats.weaponType === WeaponType.MISSILE) {
                            const dir = { x: Math.cos(currentAngle), y: Math.sin(currentAngle) };
                            const p = ProjectileFactory.createPlayerProjectile(
                                { x: playerPosRef.current.x, y: playerPosRef.current.y },
                                dir,
                                { ...baseStats, color: '#fb923c', radius: 14, damage: baseStats.damage * 1.5 }, // Missiles hit harder
                                time,
                                'player',
                                WeaponEffect.EXPLOSIVE
                            );
                            projectilesRef.current.push(p);
                        }
                    });
                }
            }
        }
    }, [autoAttack, playerPosRef, statsRef, onShotFired]);

    const updateProjectiles = useCallback((dt: number, time: number, targets: Entity[], aimDir: Vector2D) => {
        const pStats = statsRef.current;
        const newExplosions: { pos: Vector2D, radius: number, color: string }[] = [];

        // --- BURST PROCESSING (Swarm Launcher) ---
        if (burstQueueRef.current.count > 0 && time >= burstQueueRef.current.nextShotTime) {
            const angle = burstQueueRef.current.angle;
            const dir = { x: Math.cos(angle), y: Math.sin(angle) };

            const swarmStats = {
                damage: pStats.damage * 0.7, // Swarm individual weaker
                speed: pStats.bulletSpeed,
                color: '#e879f9',
                radius: 10,
                pierce: 1,
                critChance: pStats.critChance,
                critMult: pStats.critMultiplier,
                duration: 3000 // 3s lifetime
            };

            const p = ProjectileFactory.createPlayerProjectile(
                { x: playerPosRef.current.x, y: playerPosRef.current.y },
                dir,
                swarmStats,
                time,
                'player',
                WeaponEffect.HOMING
            );

            // Homing init
            p.turnRate = pStats.swarmAgility || 1.5;

            // Find initial target
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
                lastFireTimeRef.current = time;
            } else {
                burstQueueRef.current.nextShotTime = time + 120;
            }
        }

        // Iterate BACKWARDS
        const projs = projectilesRef.current;

        for (let i = projs.length - 1; i >= 0; i--) {
            const p = projs[i];

            // 1. Base Update (Movement, Lifetime)
            p.update(dt, time);

            // 2. Specific Logic overrides/extensions
            if (p.isAlive) {

                // --- LASER LOGIC ---
                if (p.weaponEffect === WeaponEffect.LASER) {
                    p.pos.x = playerPosRef.current.x;
                    p.pos.y = playerPosRef.current.y;

                    let targetAngle = p.angle || 0;
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

                    // Smooth Turn
                    let currentAngle = p.angle || 0;
                    let angleDiff = targetAngle - currentAngle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                    const turnSpeed = p.isFiring ? 3.0 : 8.0;
                    const step = turnSpeed * dt;
                    if (Math.abs(angleDiff) < step) {
                        p.angle = targetAngle;
                    } else {
                        p.angle = currentAngle + Math.sign(angleDiff) * step;
                    }

                    if (p.isCharging) {
                        p.chargeProgress = (p.chargeProgress || 0) + dt * 1.0;
                        if (p.chargeProgress >= 1.0) {
                            p.isCharging = false;
                            p.isFiring = true;
                            // Update duration to be current time + actual laser duration
                            // This ensures BaseProjectile.update handles the death correctly
                            p.duration = p.elapsedTime + (pStats.laserDuration || 0.3) * 1000;
                        }
                    } else if (p.isFiring) {
                        // BaseProjectile.update handles timeout based on the updated p.duration
                    }
                }

                // --- HOMING LOGIC (Swarm & Enemy Missiles) ---
                else if (p.weaponEffect === WeaponEffect.HOMING) {
                    if (p.isAlive) {
                        // Find Target
                        let target: Entity | undefined;
                        if (p.targetId) {
                            target = targets.find(t => t.id === p.targetId && t.health > 0); // Must be alive
                            // note: targets list might be just Enemies, or Player?
                            // For Player Projectiles, targets = Enemies.
                            // For Enemy Projectiles, we need Player? 
                            // The 'targets' arg passed to updateProjectiles usually is 'enemies'.
                            // If this is an Enemy Bullet, it's homing on PLAYER.
                            if (p.type === ProjectileType.ENEMY_BULLET) {
                                // For enemy missile, target is always player (implicit)
                                // We fake a target entity for logic reuse
                                target = { id: 'player', pos: playerPosRef.current, health: 1 } as any;
                            }
                        }

                        // Retargetting for Player Missiles
                        if ((!target) && p.type === ProjectileType.PLAYER_BULLET) {
                            let nearest: Entity | null = null;
                            let minDist = 600;
                            targets.forEach(t => {
                                const d = Math.hypot(t.pos.x - p.pos.x, t.pos.y - p.pos.y);
                                if (d < minDist) { minDist = d; nearest = t; }
                            });
                            if (nearest) {
                                p.targetId = nearest.id;
                                target = nearest;
                            }
                        }

                        // Steer
                        if (target) {
                            const dx = target.pos.x - p.pos.x;
                            const dy = target.pos.y - p.pos.y;
                            const targetAngle = Math.atan2(dy, dx);

                            let currentAngle = Math.atan2(p.vel.y, p.vel.x);
                            let diff = targetAngle - currentAngle;
                            while (diff > Math.PI) diff -= Math.PI * 2;
                            while (diff < -Math.PI) diff += Math.PI * 2;

                            const turnStep = (p.turnRate || 1.5) * dt;
                            if (Math.abs(diff) < turnStep) {
                                currentAngle = targetAngle;
                            } else {
                                currentAngle += Math.sign(diff) * turnStep;
                            }

                            // Missiles accelerate
                            const speed = Math.hypot(p.vel.x, p.vel.y);
                            // const finalSpeed = speed < 350 ? speed * 1.01 : speed; // Cap acceleration?
                            // Base speed is in p.speed.
                            // Let's just use constant speed for now to be safe

                            p.vel.x = Math.cos(currentAngle) * speed;
                            p.vel.y = Math.sin(currentAngle) * speed;
                        }
                    }
                }
            }

            // Check for timeout explosion (Moved outside isAlive check because p.update() might have just killed it)
            // If it died naturally (elapsedTime > duration) AND it's a type that explodes
            if (!p.isAlive && (p.elapsedTime > p.duration)) {
                if (p.weaponEffect === WeaponEffect.HOMING || p.weaponEffect === WeaponEffect.EXPLOSIVE) {
                    // Check if we already exploded? BaseProjectile doesn't track 'hasExploded'.
                    // But we are in the loop where we remove it.
                    // The loop checks !p.isAlive at the end and removes it.
                    // So this is the ONE frame where we catch it dead before removal.
                    if (p.type === ProjectileType.PLAYER_BULLET) {
                        newExplosions.push({ pos: p.pos, radius: 150, color: p.color });
                    } else if (p.type === ProjectileType.ENEMY_BULLET) {
                        newExplosions.push({ pos: p.pos, radius: 80, color: p.color });
                    }
                }
            }

            if (!p.isAlive) {
                projs[i] = projs[projs.length - 1];
                projs.pop();
            }
        }

        return { newExplosions };
    }, [playerPosRef, statsRef, autoAttack, onShotFired]);

    const addProjectiles = useCallback((newProjs: any[]) => {
        // Adapt generic spawns to BaseProjectile if they aren't already
        // This is called by EnemyFactory/Enemy update.
        // We assume they return BaseProjectile or compatible objects now?
        // Actually Enemy update returns 'IProjectileSpawn' which is just data.
        // We need to convert it here.

        const converted = newProjs.map(spawn => {
            if (spawn instanceof BaseProjectile) return spawn;

            // Convert legacy spawn data or interface data to BaseProjectile
            // This handles the 'enemyBulletsToSpawn' from useEnemies
            return ProjectileFactory.createEnemyProjectile(
                spawn.pos,
                spawn.vel ? {
                    x: spawn.vel.x / (Math.hypot(spawn.vel.x, spawn.vel.y) || 1),
                    y: spawn.vel.y / (Math.hypot(spawn.vel.x, spawn.vel.y) || 1)
                } : { x: 0, y: 0 },
                {
                    damage: 10, // Base damage, scaled by level in useCollision
                    speed: Math.hypot(spawn.vel?.x || 0, spawn.vel?.y || 0) || 150,
                    color: spawn.color,
                    radius: spawn.radius,
                    lifetime: spawn.maxDuration ? spawn.maxDuration * 1000 : 4000,
                    isHoming: spawn.isHoming,
                    turnRate: spawn.turnRate,
                    level: spawn.level,
                    isElite: spawn.isElite,
                    isMiniboss: (spawn as any).isMiniboss, // Cast as any if not in IProjectileSpawn yet, or rely on optional
                    isLegendary: spawn.isLegendary
                },
                performance.now(), // Approximation
                'player'
            );
        });

        projectilesRef.current.push(...converted);
    }, []);

    return { projectilesRef, autoAttack, setAutoAttack, initProjectiles, fireWeapon, updateProjectiles, addProjectiles };
};
