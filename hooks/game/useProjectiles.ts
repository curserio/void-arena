
import React, { useRef, useCallback, useState } from 'react';
import { Entity, EntityType, Vector2D, WeaponType, PlayerStats } from '../../types';
import { TARGETING_RADIUS } from '../../constants';
import { IProjectile, ProjectileType, WeaponEffect } from '../../types/projectiles';
import { ProjectileFactory } from '../../core/factories/ProjectileFactory';
import { BaseProjectile } from '../../core/entities/projectiles/BaseProjectile';
import { projectileBehaviorManager, ProjectileBehaviorContext } from '../../core/systems/projectiles';
import { getWeaponBehavior, FireContext } from '../../core/systems/weapons';

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
                // Get weapon behavior from registry
                const behavior = getWeaponBehavior(pStats.weaponType);

                if (!behavior) {
                    console.warn(`No behavior registered for weapon: ${pStats.weaponType}`);
                    return;
                }

                // Check if behavior uses burst mode (e.g. Swarm Launcher)
                if (behavior.usesBurstMode) {
                    if (burstQueueRef.current.count > 0) return;

                    burstQueueRef.current.count = pStats.swarmCount;
                    burstQueueRef.current.nextShotTime = time;
                    burstQueueRef.current.angle = fireAngle;
                    burstQueueRef.current.hasTarget = true;
                    return;
                }

                // Check if weapon can fire (e.g. Laser checks for existing laser)
                const fireCtx: FireContext = {
                    playerPos: { x: playerPosRef.current.x, y: playerPosRef.current.y },
                    fireAngle,
                    stats: pStats,
                    time,
                    isOmni,
                    isPierce
                };

                if (behavior.canFire && !behavior.canFire(fireCtx, projectilesRef.current)) {
                    return;
                }

                lastFireTimeRef.current = time;
                onShotFired();

                // Fire weapon and add projectiles
                const newProjectiles = behavior.fire(fireCtx);
                projectilesRef.current.push(...newProjectiles);
            }
        }
    }, [autoAttack, playerPosRef, statsRef, onShotFired]);

    const updateProjectiles = useCallback((dt: number, time: number, targets: Entity[], aimDir: Vector2D) => {
        const pStats = statsRef.current;
        const newExplosions: { pos: Vector2D, radius: number, color: string }[] = [];

        // --- BURST PROCESSING (Swarm Launcher) ---
        if (burstQueueRef.current.count > 0 && time >= burstQueueRef.current.nextShotTime) {
            const swarmBehavior = getWeaponBehavior(WeaponType.SWARM_LAUNCHER);

            if (swarmBehavior) {
                const burstCtx: FireContext = {
                    playerPos: { x: playerPosRef.current.x, y: playerPosRef.current.y },
                    fireAngle: burstQueueRef.current.angle,
                    stats: pStats,
                    time,
                    isOmni: false,
                    isPierce: false
                };

                const rockets = swarmBehavior.fire(burstCtx);

                // Find initial target for homing
                let nearest: Entity | null = null;
                let minDist = 800;
                targets.forEach(t => {
                    const d = Math.hypot(t.pos.x - playerPosRef.current.x, t.pos.y - playerPosRef.current.y);
                    if (d < minDist) { minDist = d; nearest = t; }
                });

                rockets.forEach(p => {
                    if (nearest) p.targetId = nearest.id;
                    projectilesRef.current.push(p);
                });

                onShotFired();
            }

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
