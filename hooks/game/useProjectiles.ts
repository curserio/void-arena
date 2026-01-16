
import React, { useRef, useCallback, useState } from 'react';
import { Entity, EntityType, Vector2D, WeaponType, PlayerStats } from '../../types';
import { TARGETING_RADIUS } from '../../constants';
import { IProjectile, ProjectileType, WeaponEffect } from '../../types/projectiles';
import { ProjectileFactory } from '../../core/factories/ProjectileFactory';
import { BaseProjectile } from '../../core/entities/projectiles/BaseProjectile';
import { projectileBehaviorManager, ProjectileBehaviorContext } from '../../core/systems/projectiles';

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
                    // STANDARD (PLASMA / MISSILE / RAILGUN / FLAK)
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
                        } else if (pStats.weaponType === WeaponType.RAILGUN) {
                            // RAILGUN: Single high-damage piercing shot
                            const dir = { x: Math.cos(currentAngle), y: Math.sin(currentAngle) };
                            const p = ProjectileFactory.createPlayerProjectile(
                                { x: playerPosRef.current.x, y: playerPosRef.current.y },
                                dir,
                                { ...baseStats, color: '#60a5fa', radius: 6, pierce: 999, duration: 1500 }, // Blue, thin, infinite pierce
                                time
                            );
                            projectilesRef.current.push(p);
                        } else if (pStats.weaponType === WeaponType.FLAK_CANNON) {
                            // FLAK CANNON: pellets in 45° spread (base 8, upgradeable via Scattershot)
                            const pelletCount = pStats.bulletCount; // Uses bulletCount from stats
                            const spreadAngle = Math.PI / 4; // 45 degrees
                            const startAngle = currentAngle - spreadAngle / 2;
                            const angleStep = pelletCount > 1 ? spreadAngle / (pelletCount - 1) : 0;

                            for (let i = 0; i < pelletCount; i++) {
                                const pAngle = startAngle + i * angleStep;
                                const dir = { x: Math.cos(pAngle), y: Math.sin(pAngle) };
                                const p = ProjectileFactory.createPlayerProjectile(
                                    { x: playerPosRef.current.x, y: playerPosRef.current.y },
                                    dir,
                                    { ...baseStats, color: '#fbbf24', radius: 5, duration: 800 }, // Medium range, golden
                                    time
                                );
                                projectilesRef.current.push(p);
                            }
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

        // --- PROJECTILE UPDATE VIA BEHAVIOR MANAGER ---
        const behaviorCtx: ProjectileBehaviorContext = {
            dt,
            time,
            playerPos: playerPosRef.current,
            targets,
            aimDir,
            autoAttack,
            playerStats: {
                laserDuration: pStats.laserDuration,
            },
        };

        const { alive, explosions } = projectileBehaviorManager.updateAll(
            projectilesRef.current,
            behaviorCtx
        );

        projectilesRef.current = alive;

        return { newExplosions: explosions };
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
                    damage: spawn.damage ?? 10, // Use pre-calculated damage from enemy
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
