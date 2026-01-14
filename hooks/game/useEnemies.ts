import React, { useRef, useCallback } from 'react';
import React, { Entity, EntityType, Vector2D } from '../../types';
import React, { WORLD_SIZE } from '../../constants';

export const useEnemies = (
    playerPosRef: React.MutableRefObject<Vector2D>
) => {
    const enemiesRef = useRef<Entity[]>([]);
    const spawnTimerRef = useRef(0);

    const initEnemies = useCallback(() => {
        enemiesRef.current = [];
        spawnTimerRef.current = 0;

        // Initial Asteroids
        for (let i = 0; i < 20; i++) {
            const r = 35 + Math.random() * 45;
            enemiesRef.current.push({
                id: Math.random().toString(36), type: EntityType.ASTEROID,
                pos: { x: Math.random() * WORLD_SIZE, y: Math.random() * WORLD_SIZE },
                vel: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 },
                radius: r, health: r * 5, maxHealth: r * 5, color: '#475569', seed: Math.random(),
                lastHitTime: 0
            });
        }
    }, []);

    const spawnEnemy = useCallback((gameTime: number) => {
        const baseDifficultyLevel = Math.max(1, Math.floor(1 + gameTime / 45));
        const roll = Math.random();
        let levelOffset = (roll < 0.6) ? (Math.random() > 0.5 ? -1 : -2) : (roll > 0.95 ? 3 : (roll > 0.9 ? 1 : 0));
        const enemyLevel = Math.max(1, baseDifficultyLevel + levelOffset);
        const isElite = levelOffset >= 3;

        const typeRoll = Math.random();
        let type = EntityType.ENEMY_SCOUT;
        if (typeRoll > 0.88 && gameTime > 20) {
            type = EntityType.ENEMY_LASER_SCOUT;
        } else if (typeRoll > 0.75) {
            type = EntityType.ENEMY_STRIKER;
        }

        const a = Math.random() * Math.PI * 2;
        const d = 800 + Math.random() * 400;
        const x = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.x + Math.cos(a) * d));
        const y = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.y + Math.sin(a) * d));

        const levelMult = 1 + (enemyLevel - 1) * 0.25;
        const eliteScale = isElite ? 1.5 : 1.0;

        let baseHp = (type === EntityType.ENEMY_STRIKER ? 300 : 120) * levelMult;
        let hasShield = isElite || (enemyLevel >= 3 && Math.random() > 0.6);
        let mShield = hasShield ? baseHp * 0.4 * eliteScale : 0;
        let color = isElite ? '#f0f' : (type === EntityType.ENEMY_STRIKER ? `hsl(${340 + Math.random() * 20}, 80%, 60%)` : `hsl(${260 + Math.random() * 30}, 80%, 60%)`);

        if (type === EntityType.ENEMY_LASER_SCOUT) {
            baseHp = (enemyLevel * 25) + 50;
            mShield = (baseHp * 4.0) * eliteScale;
            color = '#a855f7';
        }

        enemiesRef.current.push({
            id: Math.random().toString(36),
            type: type,
            pos: { x, y }, vel: { x: 0, y: 0 },
            radius: (type === EntityType.ENEMY_STRIKER ? 24 : 22) * eliteScale * Math.min(1.4, 1 + (levelMult - 1) * 0.1),
            health: baseHp * eliteScale, maxHealth: baseHp * eliteScale,
            shield: mShield, maxShield: mShield,
            color: color,
            isMelee: type === EntityType.ENEMY_STRIKER,
            level: enemyLevel, aiPhase: Math.random() * Math.PI * 2, aiSeed: Math.random(),
            lastHitTime: 0, lastShieldHitTime: 0,
            isCharging: false, isFiring: false, chargeProgress: 0, lastShotTime: 0
        });
    }, [playerPosRef]);

    const updateEnemies = useCallback((dt: number, time: number, gameTime: number) => {
        // Spawn Logic
        spawnTimerRef.current += dt;
        if (spawnTimerRef.current > Math.max(0.4, 1.4 - (gameTime / 180))) {
            spawnEnemy(gameTime);
            spawnTimerRef.current = 0;
        }

        const nextEnemies: Entity[] = [];
        const enemyBulletsToSpawn: Entity[] = []; // Collect new bullets to spawn

        enemiesRef.current.forEach(e => {
            let alive = true;

            if (e.type === EntityType.ENEMY_SCOUT || e.type === EntityType.ENEMY_STRIKER || e.type === EntityType.ENEMY_LASER_SCOUT) {
                const dx = playerPosRef.current.x - e.pos.x, dy = playerPosRef.current.y - e.pos.y, d = Math.hypot(dx, dy);
                const baseSpd = (e.type === EntityType.ENEMY_STRIKER ? 100 : 70) * (1 + ((e.level || 1) * 0.05));
                let sepX = 0, sepY = 0;

                // Separation boid logic - optimization: only check nearby enemies? 
                // For now, simple O(N^2) check against other enemies is expensive if N is large.
                // But we are in "execution" so I should implement what was there, maybe slightly optimized.
                enemiesRef.current.forEach(other => {
                    if (other.id === e.id) return;
                    if (Math.abs(other.pos.x - e.pos.x) > 100 || Math.abs(other.pos.y - e.pos.y) > 100) return; // Simple bounding box pre-check
                    const odx = e.pos.x - other.pos.x, ody = e.pos.y - other.pos.y, od = Math.hypot(odx, ody);
                    if (od < 80) { sepX += (odx / od) * (80 - od) * 1.5; sepY += (ody / od) * (80 - od) * 1.5; }
                });

                if (e.type === EntityType.ENEMY_LASER_SCOUT) {
                    const idealDist = 450;
                    if (!e.isCharging && !e.isFiring) {
                        if (d > idealDist + 50) { e.vel.x = (dx / d) * baseSpd + sepX; e.vel.y = (dy / d) * baseSpd + sepY; }
                        else if (d < idealDist - 50) { e.vel.x = (-dx / d) * baseSpd + sepX; e.vel.y = (-dy / d) * baseSpd + sepY; }
                        else { e.vel.x = Math.sin(time * 0.001) * baseSpd * 0.5 + sepX; e.vel.y = Math.cos(time * 0.001) * baseSpd * 0.5 + sepY; }
                    } else {
                        e.vel.x *= 0.85; e.vel.y *= 0.85;
                    }

                    if (!e.isCharging && !e.isFiring && time - (e.lastShotTime || 0) > 4000) {
                        e.isCharging = true; e.chargeProgress = 0; e.angle = Math.atan2(dy, dx);
                    }
                    if (e.isCharging) {
                        e.chargeProgress = (e.chargeProgress || 0) + dt * 0.3;
                        if (e.chargeProgress >= 1.0) { e.isCharging = false; e.isFiring = true; e.chargeProgress = 0; e.lastShotTime = time; }
                    }
                    if (e.isFiring) {
                        e.chargeProgress = (e.chargeProgress || 0) + dt * 2.0;
                        // Hit check currently happens in Renderer or here?
                        // In original code it was in update loop.
                        // We should expose the "hit player" event.
                        if (e.chargeProgress >= 1.0) { e.isFiring = false; e.chargeProgress = 0; }
                    }
                } else if (e.isMelee) {
                    const a = Math.atan2(dy, dx) + Math.sin(time * 0.004 + (e.aiPhase || 0)) * 0.4;
                    const pulse = 0.8 + Math.sin(time * 0.006 + (e.aiPhase || 0)) * 0.4;
                    e.vel.x = Math.cos(a) * baseSpd * pulse + sepX; e.vel.y = Math.sin(a) * baseSpd * pulse + sepY;
                } else {
                    const idealAngle = (e.aiSeed || 0) * Math.PI * 2 + (time * 0.0001);
                    const tx = playerPosRef.current.x + Math.cos(idealAngle) * 350, ty = playerPosRef.current.y + Math.sin(idealAngle) * 350;
                    const toTX = tx - e.pos.x, toTY = ty - e.pos.y, distT = Math.hypot(toTX, toTY);
                    if (distT > 20) { e.vel.x = (toTX / distT) * baseSpd + sepX; e.vel.y = (toTY / distT) * baseSpd + sepY; }
                    else { e.vel.x = Math.sin(time * 0.002 + (e.aiPhase || 0)) * 20 + sepX; e.vel.y = Math.cos(time * 0.002 + (e.aiPhase || 0)) * 20 + sepY; }

                    if (time - (e.lastShotTime || 0) > 3000) {
                        e.lastShotTime = time;
                        const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
                        enemyBulletsToSpawn.push({ id: Math.random().toString(36), type: EntityType.ENEMY_BULLET, pos: { ...e.pos }, vel: { x: Math.cos(a) * 260, y: Math.sin(a) * 260 }, radius: 7, health: 1, maxHealth: 1, color: '#f97316', level: e.level });
                    }
                }
                e.pos.x += e.vel.x * dt; e.pos.y += e.vel.y * dt;
            } else if (e.type === EntityType.ASTEROID) {
                if (e.pos.x < e.radius || e.pos.x > WORLD_SIZE - e.radius) e.vel.x *= -1;
                if (e.pos.y < e.radius || e.pos.y > WORLD_SIZE - e.radius) e.vel.y *= -1;
                e.pos.x += e.vel.x * dt; e.pos.y += e.vel.y * dt;
            }

            if (e.health <= 0) alive = false;
            if (alive) nextEnemies.push(e);
        });

        enemiesRef.current = nextEnemies;
        return { enemyBulletsToSpawn };
    }, [spawnEnemy, playerPosRef]);

    return { enemiesRef, initEnemies, updateEnemies };
};
