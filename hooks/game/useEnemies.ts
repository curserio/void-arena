
import React, { useRef, useCallback } from 'react';
import { Entity, EntityType, Vector2D, DifficultyConfig } from '../../types';
import { WORLD_SIZE } from '../../constants';

export const useEnemies = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    difficulty: DifficultyConfig,
    spawnSpawnFlash: (pos: Vector2D) => void
) => {
    const enemiesRef = useRef<Entity[]>([]);
    const spawnTimerRef = useRef(0);
    const lastBossWaveRef = useRef(0); // Track which boss wave we are on

    const initEnemies = useCallback(() => {
        enemiesRef.current = [];
        spawnTimerRef.current = 0;
        lastBossWaveRef.current = 0;
        // Initial asteroid belt
        for (let i = 0; i < 25; i++) {
            const r = 35 + Math.random() * 45;
            enemiesRef.current.push({
                id: Math.random().toString(36), type: EntityType.ASTEROID,
                pos: { x: Math.random() * WORLD_SIZE, y: Math.random() * WORLD_SIZE },
                vel: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 },
                radius: r, health: r * 5 * difficulty.statMultiplier, maxHealth: r * 5 * difficulty.statMultiplier, 
                color: '#475569', seed: Math.random(),
                lastHitTime: 0
            });
        }
    }, [difficulty]);

    const createEnemy = (type: EntityType, x: number, y: number, gameMinutes: number, difficultyMultiplier: number, levelBonus: number, isEliteOverride?: boolean, isMinibossOverride?: boolean) => {
        let isMiniboss = isMinibossOverride !== undefined ? isMinibossOverride : false;
        let isElite = isEliteOverride !== undefined ? isEliteOverride : Math.random() < Math.min(0.2, 0.01 + gameMinutes * 0.02);

        // Miniboss logic from original code, mostly applies if passed in or rolled
        if (!isMiniboss && !isElite && Math.random() < 0.03 && gameMinutes > 1.5) {
             // 3% chance for random miniboss if not already special
        }

        let baseHp = 100;
        let baseRadius = 22;
        let color = '#fff';
        let hasDeathDefiance = false;

        if (type === EntityType.ENEMY_SCOUT) {
            baseHp = 80 * difficultyMultiplier;
            color = `hsl(${260 + Math.random() * 30}, 80%, 60%)`;
        } else if (type === EntityType.ENEMY_STRIKER) {
            baseHp = 220 * difficultyMultiplier;
            baseRadius = 26;
            color = `hsl(${340 + Math.random() * 20}, 80%, 60%)`;
        } else if (type === EntityType.ENEMY_LASER_SCOUT) {
            baseHp = 150 * difficultyMultiplier;
            baseRadius = 24;
            color = '#a855f7';
        } else if (type === EntityType.ENEMY_KAMIKAZE) {
            baseHp = 40 * difficultyMultiplier; // Low HP
            baseRadius = 18;
            color = '#f97316'; // Orange
        }

        if (isMiniboss) {
            baseHp *= 12;
            baseRadius *= 2.0;
            color = '#ef4444';
        } else if (isElite) {
            baseHp *= 3;
            baseRadius *= 1.3;
            color = '#f0f';
            
            // Special Ability for Elite Kamikaze
            if (type === EntityType.ENEMY_KAMIKAZE) {
                hasDeathDefiance = true;
            }
        }

        const maxShield = (isMiniboss || isElite || (gameMinutes > 5 && Math.random() > 0.7)) ? baseHp * 0.5 : 0;
        
        // Spawn Flash Check
        const distToPlayer = Math.hypot(x - playerPosRef.current.x, y - playerPosRef.current.y);
        if (distToPlayer < 1300) {
            spawnSpawnFlash({ x, y });
        }

        return {
            id: Math.random().toString(36),
            type: type,
            pos: { x, y }, vel: { x: 0, y: 0 },
            radius: baseRadius,
            health: baseHp, maxHealth: baseHp,
            shield: maxShield, maxShield: maxShield,
            color: color,
            isMelee: type === EntityType.ENEMY_STRIKER,
            level: Math.floor(difficultyMultiplier) + levelBonus, 
            isElite: isElite, 
            isMiniboss: isMiniboss,
            hasDeathDefiance: hasDeathDefiance,
            aiPhase: Math.random() * Math.PI * 2, 
            aiSeed: Math.random(),
            lastHitTime: 0, lastShieldHitTime: 0,
            isCharging: false, isFiring: false, chargeProgress: 0, 
            lastShotTime: 0
        };
    };

    const spawnEnemy = useCallback((gameTime: number, currentTime: number) => {
        const gameMinutes = gameTime / 60;
        
        // 1. Difficulty Scaling (Time + Selected Mode)
        const difficultyMultiplier = (1 + (gameMinutes * 0.4) + (Math.pow(gameMinutes, 1.5) * 0.1)) * difficulty.statMultiplier;
        const levelBonus = difficulty.enemyLevelBonus;

        // --- BOSS SPAWNING LOGIC ---
        // Spawn a boss every 3 minutes (180 seconds)
        const bossInterval = 180;
        const currentBossWave = Math.floor(gameTime / bossInterval);
        
        if (currentBossWave > lastBossWaveRef.current) {
            lastBossWaveRef.current = currentBossWave;
            
            // Spawn Boss
            const a = Math.random() * Math.PI * 2;
            const d = 1100; // Force boss distance
            const x = Math.max(100, Math.min(WORLD_SIZE - 100, playerPosRef.current.x + Math.cos(a) * d));
            const y = Math.max(100, Math.min(WORLD_SIZE - 100, playerPosRef.current.y + Math.sin(a) * d));
            
            const bossHp = 5000 * difficultyMultiplier * (1 + (currentBossWave * 0.5));
            
            enemiesRef.current.push({
                id: `BOSS-${Math.random()}`,
                type: EntityType.ENEMY_BOSS,
                pos: { x, y },
                vel: { x: 0, y: 0 },
                radius: 70, // Huge
                health: bossHp,
                maxHealth: bossHp,
                shield: bossHp * 0.25,
                maxShield: bossHp * 0.25,
                color: '#4ade80', // Green Theme
                level: Math.floor(difficultyMultiplier) + 5 + levelBonus,
                isBoss: true,
                aiPhase: 0,
                lastHitTime: 0, lastShieldHitTime: 0,
                isCharging: false, isFiring: false, chargeProgress: 0,
                lastShotTime: currentTime + 2000 // Initial delay
            });
            
            // Trigger Spawn Flash for Boss
            spawnSpawnFlash({ x, y });
            
            // Don't spawn other enemies this frame
            return;
        }

        // 2. Normal Enemy Type Roll
        const roll = Math.random();
        
        // 10% Chance for Kamikaze Wave (starts a bit later)
        if (gameTime > 30 && roll > 0.90) {
            // KAMIKAZE SPAWN
            const spawnCount = 3 + Math.floor(Math.random() * 3); // 3-5 drones
            const angle = Math.random() * Math.PI * 2;
            const dist = 900 + Math.random() * 300;
            const baseX = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.x + Math.cos(angle) * dist));
            const baseY = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.y + Math.sin(angle) * dist));

            const isEliteWave = Math.random() < 0.2; 

            if (isEliteWave) {
                 // Single Elite
                 const e = createEnemy(EntityType.ENEMY_KAMIKAZE, baseX, baseY, gameMinutes, difficultyMultiplier, levelBonus, true, false);
                 enemiesRef.current.push(e);
            } else {
                // Swarm
                for (let i = 0; i < spawnCount; i++) {
                    const offsetX = (Math.random() - 0.5) * 100;
                    const offsetY = (Math.random() - 0.5) * 100;
                    const e = createEnemy(EntityType.ENEMY_KAMIKAZE, baseX + offsetX, baseY + offsetY, gameMinutes, difficultyMultiplier, levelBonus, false, false);
                    enemiesRef.current.push(e);
                }
            }
            return;
        }

        let type = EntityType.ENEMY_SCOUT;
        if (roll > 0.75 && gameTime > 60) type = EntityType.ENEMY_LASER_SCOUT;
        else if (roll > 0.60) type = EntityType.ENEMY_STRIKER;

        const a = Math.random() * Math.PI * 2;
        const d = 1000 + Math.random() * 400; 
        const x = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.x + Math.cos(a) * d));
        const y = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.y + Math.sin(a) * d));

        enemiesRef.current.push(createEnemy(type, x, y, gameMinutes, difficultyMultiplier, levelBonus));

    }, [playerPosRef, difficulty, spawnSpawnFlash]);

    const updateEnemies = useCallback((dt: number, time: number, gameTime: number) => {
        // --- SPAWNING LOGIC ---
        const cycleTime = 120;
        const rushDuration = 20;
        const timeInCycle = gameTime % cycleTime;
        const isRushHour = timeInCycle > (cycleTime - rushDuration);
        
        let spawnDelay = Math.max(0.1, 1.2 - (gameTime / 300));
        if (isRushHour) spawnDelay /= 3;

        spawnDelay /= (1 + (difficulty.statMultiplier - 1) * 0.2);

        spawnTimerRef.current += dt;
        if (spawnTimerRef.current > spawnDelay) {
            spawnEnemy(gameTime, time);
            spawnTimerRef.current = 0;
        }

        // --- UPDATE LOOP ---
        const nextEnemies: Entity[] = [];
        const enemyBulletsToSpawn: Entity[] = []; 
        const playerPos = playerPosRef.current;

        enemiesRef.current.forEach(e => {
            let alive = true;

            // Apply Slow Decay
            let speedMult = 1.0;
            if (e.slowUntil && e.slowUntil > time) {
                speedMult = 1.0 - (e.slowFactor || 0);
            }
            
            const dx = playerPos.x - e.pos.x, dy = playerPos.y - e.pos.y, d = Math.hypot(dx, dy);

            if (e.type === EntityType.ENEMY_BOSS) {
                const bossSpeed = 40 * speedMult; 
                if (d > 400 && !e.isFiring) {
                    e.vel.x = (dx / d) * bossSpeed;
                    e.vel.y = (dy / d) * bossSpeed;
                } else {
                    e.vel.x *= 0.95; 
                    e.vel.y *= 0.95;
                }
                e.pos.x += e.vel.x * dt;
                e.pos.y += e.vel.y * dt;

                const targetAngle = Math.atan2(dy, dx);
                let currentAngle = e.angle || 0;
                let angleDiff = targetAngle - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                e.angle = currentAngle + angleDiff * 0.8 * dt;

                if (!e.isCharging && !e.isFiring && (time - (e.lastShotTime || 0) > 6000)) {
                    e.isCharging = true; e.chargeProgress = 0;
                }
                if (e.isCharging) {
                    e.chargeProgress = (e.chargeProgress || 0) + dt * 0.4;
                    if (e.chargeProgress >= 1.0) {
                        e.isCharging = false; e.isFiring = true; e.chargeProgress = 0; e.lastShotTime = time;
                    }
                }
                if (e.isFiring) {
                    e.chargeProgress = (e.chargeProgress || 0) + dt * 0.25; // Adjusted to ~4s fire duration (was 0.15)
                    if (e.chargeProgress >= 1.0) { e.isFiring = false; e.chargeProgress = 0; }
                }

            } else {
                // STANDARD ENEMIES
                const speedScale = 1 + (gameTime / 600) * 0.5; 
                
                let baseSpd = 80;
                if (e.type === EntityType.ENEMY_STRIKER) baseSpd = 110;
                if (e.type === EntityType.ENEMY_KAMIKAZE) baseSpd = 350; 

                baseSpd *= speedScale * speedMult;
                if (e.isMiniboss) baseSpd *= 0.65;
                if (e.isElite && e.type !== EntityType.ENEMY_KAMIKAZE) baseSpd *= 0.8;

                // Separation
                let sepX = 0, sepY = 0;
                enemiesRef.current.forEach(other => {
                    if (other.id === e.id) return;
                    if (Math.abs(other.pos.x - e.pos.x) > (e.radius + other.radius + 50)) return; 
                    const odx = e.pos.x - other.pos.x, ody = e.pos.y - other.pos.y, od = Math.hypot(odx, ody);
                    if (od < e.radius + other.radius + 10) { 
                        sepX += (odx / od) * 150; sepY += (ody / od) * 150; 
                    }
                });

                if (e.type === EntityType.ENEMY_KAMIKAZE) {
                     // NEW LOGIC: Inertia-based Drift
                     const currentSpeed = Math.hypot(e.vel.x, e.vel.y);
                     const targetDirX = dx / d;
                     const targetDirY = dy / d;

                     // Determine new direction (Steering)
                     // If speed is 0 (just spawned), align instantly to create explosive start
                     let newDirX = targetDirX;
                     let newDirY = targetDirY;

                     if (currentSpeed > 50) {
                         // Turning Inertia: How fast can they change vector?
                         const turnRate = 2.5 * dt; // Adjusts how "drifty" they are
                         const normVelX = e.vel.x / currentSpeed;
                         const normVelY = e.vel.y / currentSpeed;
                         
                         newDirX = normVelX + (targetDirX - normVelX) * turnRate;
                         newDirY = normVelY + (targetDirY - normVelY) * turnRate;
                         
                         // Re-normalize
                         const len = Math.hypot(newDirX, newDirY);
                         newDirX /= len;
                         newDirY /= len;
                     }

                     // Speed Logic
                     // Check alignment with target to determine acceleration
                     const alignment = (newDirX * targetDirX) + (newDirY * targetDirY);
                     let newSpeed = currentSpeed;

                     if (currentSpeed < 50) {
                         // Explosive Launch
                         newSpeed = baseSpd;
                     } else if (alignment > 0.9) {
                         // Aligned: Accelerate SLOWLY
                         // WAS 120, increased to 250 for snappier recovery
                         const acceleration = 250 * dt; 
                         newSpeed = Math.min(baseSpd, currentSpeed + acceleration);
                     } else {
                         // Turning / Drifting: Decelerate (Scrub speed)
                         newSpeed = Math.max(100, currentSpeed * 0.97); 
                     }
                     
                     // Apply Velocity
                     e.vel.x = newDirX * newSpeed;
                     e.vel.y = newDirY * newSpeed;

                     // Add separation forces (external influence)
                     e.vel.x += sepX * dt * 5;
                     e.vel.y += sepY * dt * 5;

                } else if (e.type === EntityType.ENEMY_LASER_SCOUT) {
                    const optimalRange = 600; 
                    const orbitDir = (e.aiSeed || 0) > 0.5 ? 1 : -1;
                    let moveX = 0; let moveY = 0;

                    if (d > optimalRange) {
                        moveX += (dx / d) * baseSpd * 1.0; moveY += (dy / d) * baseSpd * 1.0;
                    } else {
                        moveX += (-dx / d) * baseSpd * 1.2; moveY += (-dy / d) * baseSpd * 1.2;
                    }

                    moveX += (-dy / d) * baseSpd * 0.8 * orbitDir;
                    moveY += (dx / d) * baseSpd * 0.8 * orbitDir;
                    moveX += sepX; moveY += sepY;

                    if (e.isFiring || e.isCharging) { e.vel.x = 0; e.vel.y = 0; } else { e.vel.x = moveX; e.vel.y = moveY; }

                    if (!e.isCharging && !e.isFiring && (time - (e.lastShotTime || 0) > 4000) && d < 850) {
                        e.isCharging = true; e.chargeProgress = 0; e.angle = Math.atan2(dy, dx);
                    }
                    if (e.isCharging) {
                        if ((e.chargeProgress || 0) < 0.5) {
                            const targetAngle = Math.atan2(dy, dx);
                            let angleDiff = targetAngle - (e.angle || 0);
                            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                            e.angle = (e.angle || 0) + angleDiff * 0.1; 
                        }
                        e.chargeProgress = (e.chargeProgress || 0) + dt * 0.5;
                        if (e.chargeProgress >= 1.0) { e.isCharging = false; e.isFiring = true; e.chargeProgress = 0; e.lastShotTime = time; }
                    }
                    if (e.isFiring) {
                        e.chargeProgress = (e.chargeProgress || 0) + dt * 0.8; // Slowed down: ~1.25s fire duration
                        if (e.chargeProgress >= 1.0) { e.isFiring = false; e.chargeProgress = 0; }
                    }

                } else if (e.isMelee) {
                    if (d < 250 && !e.isDashing && time - (e.lastShotTime || 0) > 5000) {
                        e.isDashing = true; e.dashUntil = time + 600; e.lastShotTime = time; 
                        e.vel.x = (dx/d) * baseSpd * 3.5; e.vel.y = (dy/d) * baseSpd * 3.5;
                    }
                    if (e.isDashing) {
                        if (time > (e.dashUntil || 0)) e.isDashing = false;
                    } else {
                        const pulse = 1.0 + Math.sin(time * 0.005 + (e.aiPhase || 0)) * 0.2;
                        e.vel.x = (dx / d) * baseSpd * pulse + sepX; e.vel.y = (dy / d) * baseSpd * pulse + sepY;
                    }
                } else if (e.type === EntityType.ENEMY_SCOUT || e.type === EntityType.ENEMY_STRIKER) {
                    const orbitRadius = 320 + (e.aiSeed || 0) * 100;
                    const idealAngle = (e.aiSeed || 0) * Math.PI * 2 + (time * 0.0003); 
                    const tx = playerPos.x + Math.cos(idealAngle) * orbitRadius;
                    const ty = playerPos.y + Math.sin(idealAngle) * orbitRadius;
                    const toTX = tx - e.pos.x, toTY = ty - e.pos.y, distT = Math.hypot(toTX, toTY);
                    e.vel.x = (toTX / distT) * baseSpd + sepX; e.vel.y = (toTY / distT) * baseSpd + sepY;

                    if (d < 600) {
                         if (time - (e.lastShotTime || 0) > 2500 + (e.aiSeed || 0) * 500) {
                            e.lastShotTime = time;
                            let bRadius = 7; let bColor = '#f97316'; let bSpeed = 320;
                            if (e.isMiniboss) { bRadius = 14; bColor = '#ef4444'; bSpeed = 400; } 
                            else if (e.isElite) { bRadius = 9; bColor = '#d946ef'; bSpeed = 350; }

                            const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.25;
                            enemyBulletsToSpawn.push({ 
                                id: Math.random().toString(36), type: EntityType.ENEMY_BULLET, 
                                pos: { ...e.pos }, vel: { x: Math.cos(a) * bSpeed, y: Math.sin(a) * bSpeed }, 
                                radius: bRadius, health: 1, maxHealth: 1, color: bColor, 
                                level: e.level, isElite: e.isElite, isMiniboss: e.isMiniboss
                            });
                        }
                    }
                } else if (e.type === EntityType.ASTEROID) {
                    if (e.pos.x < e.radius || e.pos.x > WORLD_SIZE - e.radius) e.vel.x *= -1;
                    if (e.pos.y < e.radius || e.pos.y > WORLD_SIZE - e.radius) e.vel.y *= -1;
                }
                
                e.pos.x += e.vel.x * dt; 
                e.pos.y += e.vel.y * dt;
            }

            if (e.health <= 0) alive = false;
            if (alive) nextEnemies.push(e);
        });

        enemiesRef.current = nextEnemies;
        return { enemyBulletsToSpawn };
    }, [spawnEnemy, playerPosRef, difficulty]);

    return { enemiesRef, initEnemies, updateEnemies };
};
