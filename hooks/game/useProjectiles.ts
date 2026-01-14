
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
            e.angle = 0;
            e.pierceCount = 1;
        })
    );

    const initProjectiles = useCallback(() => {
        // Return all current projectiles to pool
        const pool = poolRef.current;
        projectilesRef.current.forEach(p => pool.release(p));
        projectilesRef.current.length = 0;
        lastFireTimeRef.current = 0;
    }, []);

    const fireWeapon = useCallback((time: number, isOverdrive: boolean, isOmni: boolean, isPierce: boolean, targets: Entity[], aimDir: Vector2D) => {
        const pStats = statsRef.current;
        const fr = isOverdrive ? pStats.fireRate * 2.5 : pStats.fireRate;

        // Check for manual aim (threshold to avoid jitter)
        const isManualAim = Math.abs(aimDir.x) > 0.1 || Math.abs(aimDir.y) > 0.1;
        const shouldFire = isManualAim || (autoAttack && targets.length > 0);

        if (shouldFire && (time - lastFireTimeRef.current > 1000 / fr)) {
            let fireAngle = 0;
            let hasTarget = false;

            if (isManualAim) {
                // Manual Aim Direction
                fireAngle = Math.atan2(aimDir.y, aimDir.x);
                hasTarget = true;
            } else {
                // Auto-Aim Logic
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
                }
            }

            if (hasTarget) {
                lastFireTimeRef.current = time;
                const angles = isOmni ? [-0.3, 0, 0.3] : [0];
                const pool = poolRef.current;

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

                    } else if (pStats.weaponType === WeaponType.LASER) {
                        const p = pool.get();
                        p.id = Math.random().toString(36);
                        p.type = EntityType.BULLET;
                        p.pos.x = playerPosRef.current.x; p.pos.y = playerPosRef.current.y;
                        p.vel.x = 0; p.vel.y = 0;
                        p.radius = 18;
                        p.color = '#a855f7';
                        p.weaponType = WeaponType.LASER;
                        p.isCharging = true;
                        p.chargeProgress = 0;
                        p.angle = currentAngle;
                        p.pierceCount = isPierce ? 99 : pStats.pierceCount;

                        projectilesRef.current.push(p);
                    }
                });
            }
        }
    }, [autoAttack, playerPosRef, statsRef]);

    const updateProjectiles = useCallback((dt: number, time: number, targets: Entity[]) => {
        const pStats = statsRef.current;
        const pool = poolRef.current;
        
        // Iterate BACKWARDS to allow safe swap-remove
        const projs = projectilesRef.current;
        
        for (let i = projs.length - 1; i >= 0; i--) {
            const e = projs[i];
            let alive = e.health > 0;

            if (alive) {
                if (e.type === EntityType.BULLET) {
                    if (e.weaponType === WeaponType.LASER && e.isCharging) {
                        e.chargeProgress = (e.chargeProgress || 0) + dt * 2.0;
                        e.pos.x = playerPosRef.current.x; e.pos.y = playerPosRef.current.y;

                        // Only re-aim charging laser if it was AUTO-AIMED (no manual aim info stored here currently)
                        // For simplicity, locked lasers stay locked on angle, tracking position only
                        // Or we can simple keep angle fixed. 
                    
                        if (e.chargeProgress >= 1.0) {
                            e.isCharging = false;
                            e.vel.x = Math.cos(e.angle || 0) * pStats.bulletSpeed;
                            e.vel.y = Math.sin(e.angle || 0) * pStats.bulletSpeed;
                        }
                    }

                    if (!e.isCharging) {
                        e.pos.x += e.vel.x * dt;
                        e.pos.y += e.vel.y * dt;

                        const maxDist = e.weaponType === WeaponType.LASER ? 3600 : BULLET_MAX_DIST;
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
    }, [playerPosRef, statsRef]);

    const addProjectiles = useCallback((newProjs: Entity[]) => {
        projectilesRef.current.push(...newProjs);
    }, []);

    return { projectilesRef, autoAttack, setAutoAttack, initProjectiles, fireWeapon, updateProjectiles, addProjectiles };
};
