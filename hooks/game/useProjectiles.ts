import React, { useRef, useCallback, useState } from 'react';
import React, { Entity, EntityType, Vector2D, WeaponType, PlayerStats } from '../../types';
import React, { TARGETING_RADIUS, BULLET_MAX_DIST } from '../../constants';

export const useProjectiles = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    statsRef: React.MutableRefObject<PlayerStats>
) => {
    const projectilesRef = useRef<Entity[]>([]);
    const lastFireTimeRef = useRef(0);
    const [autoAttack, setAutoAttack] = useState(true);

    const initProjectiles = useCallback(() => {
        projectilesRef.current = [];
        lastFireTimeRef.current = 0;
    }, []);

    const fireWeapon = useCallback((time: number, isOverdrive: boolean, isOmni: boolean, isPierce: boolean, targets: Entity[]) => {
        const pStats = statsRef.current;
        const fr = isOverdrive ? pStats.fireRate * 2.5 : pStats.fireRate;

        if (autoAttack && (time - lastFireTimeRef.current > 1000 / fr)) {
            let nearest: Entity | null = null;
            let minDist = TARGETING_RADIUS;

            // Find target - Optimization: Only look for nearest within limited range
            // Since we pass 'targets' which might be all enemies, this iterates them all.
            // In clean arch, we might want to pass a Spatial Hash or Quadtree, but for now array is fine.
            targets.forEach(e => {
                const d = Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y);
                if (d < minDist) { minDist = d; nearest = e; }
            });

            if (nearest) {
                lastFireTimeRef.current = time;
                const n = nearest as Entity;
                const baseAngle = Math.atan2(n.pos.y - playerPosRef.current.y, n.pos.x - playerPosRef.current.x);
                const angles = isOmni ? [-0.3, 0, 0.3] : [0];

                angles.forEach(spreadAngle => {
                    const currentAngle = baseAngle + spreadAngle;
                    if (pStats.weaponType === WeaponType.PLASMA) {
                        const spacing = 15;
                        const startOffset = -(pStats.bulletCount - 1) * spacing / 2;
                        for (let i = 0; i < pStats.bulletCount; i++) {
                            const offset = startOffset + i * spacing;
                            const px = playerPosRef.current.x + Math.cos(currentAngle + Math.PI / 2) * offset;
                            const py = playerPosRef.current.y + Math.sin(currentAngle + Math.PI / 2) * offset;
                            projectilesRef.current.push({
                                id: Math.random().toString(36), type: EntityType.BULLET, pos: { x: px, y: py },
                                vel: { x: Math.cos(currentAngle) * pStats.bulletSpeed, y: Math.sin(currentAngle) * pStats.bulletSpeed },
                                radius: 8, health: 1, maxHealth: 1, color: '#22d3ee', pierceCount: isPierce ? 99 : 1,
                                weaponType: WeaponType.PLASMA
                            });
                        }
                    } else if (pStats.weaponType === WeaponType.MISSILE) {
                        projectilesRef.current.push({
                            id: Math.random().toString(36), type: EntityType.BULLET, pos: { ...playerPosRef.current },
                            vel: { x: Math.cos(currentAngle) * pStats.bulletSpeed, y: Math.sin(currentAngle) * pStats.bulletSpeed },
                            radius: 14, health: 1, maxHealth: 1, color: '#fb923c', weaponType: WeaponType.MISSILE
                        });
                    } else if (pStats.weaponType === WeaponType.LASER) {
                        projectilesRef.current.push({
                            id: Math.random().toString(36), type: EntityType.BULLET, pos: { ...playerPosRef.current },
                            vel: { x: 0, y: 0 },
                            radius: 18, health: 1, maxHealth: 1, color: '#a855f7', weaponType: WeaponType.LASER,
                            isCharging: true, chargeProgress: 0, angle: currentAngle,
                            pierceCount: isPierce ? 99 : pStats.pierceCount
                        });
                    }
                });
            }
        }
    }, [autoAttack, playerPosRef, statsRef]);

    const updateProjectiles = useCallback((dt: number, time: number, targets: Entity[]) => {
        const pStats = statsRef.current;
        const nextProjs: Entity[] = [];
        const newExplosions: Entity[] = [];

        projectilesRef.current.forEach(e => {
            let alive = true;
            if (e.type === EntityType.BULLET) {
                if (e.weaponType === WeaponType.LASER && e.isCharging) {
                    e.chargeProgress = (e.chargeProgress || 0) + dt * 2.0;
                    e.pos = { ...playerPosRef.current };

                    // Update angle to nearest target while charging
                    let nearest: Entity | null = null; let minD = TARGETING_RADIUS;
                    targets.forEach(en => { const d = Math.hypot(en.pos.x - e.pos.x, en.pos.y - e.pos.y); if (d < minD) { minD = d; nearest = en; } });
                    if (nearest) { const target = nearest as Entity; e.angle = Math.atan2(target.pos.y - e.pos.y, target.pos.x - e.pos.x); }

                    if (e.chargeProgress >= 1.0) {
                        e.isCharging = false;
                        e.vel = { x: Math.cos(e.angle || 0) * pStats.bulletSpeed, y: Math.sin(e.angle || 0) * pStats.bulletSpeed };
                    }
                }

                if (!e.isCharging) {
                    e.pos.x += e.vel.x * dt;
                    e.pos.y += e.vel.y * dt;

                    if (Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y) > BULLET_MAX_DIST) {
                        alive = false;
                    }
                }
            } else if (e.type === EntityType.ENEMY_BULLET) {
                e.pos.x += e.vel.x * dt;
                e.pos.y += e.vel.y * dt;
                if (Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y) > BULLET_MAX_DIST) {
                    alive = false;
                }
            }

            if (alive) nextProjs.push(e);
        });

        projectilesRef.current = nextProjs;
        return { newExplosions };
    }, [playerPosRef, statsRef]);

    // Use this to add enemy bullets or explosions
    const addProjectiles = useCallback((newProjs: Entity[]) => {
        projectilesRef.current.push(...newProjs);
    }, []);

    return { projectilesRef, autoAttack, setAutoAttack, initProjectiles, fireWeapon, updateProjectiles, addProjectiles };
};
