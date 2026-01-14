
import { useRef, useCallback } from 'react';
import { Entity, EntityType, Vector2D } from '../../types';
import { WORLD_SIZE } from '../../constants';

export const useEnemies = (
    playerPosRef: React.MutableRefObject<Vector2D>
) => {
    const enemiesRef = useRef<Entity[]>([]);
    const spawnTimerRef = useRef(0);

    const initEnemies = useCallback(() => {
        enemiesRef.current = [];
        spawnTimerRef.current = 0;
        // Initial asteroid belt
        for (let i = 0; i < 25; i++) {
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

    const spawnEnemy = useCallback((gameTime: number, currentTime: number) => {
        const gameMinutes = gameTime / 60;
        
        // 1. Difficulty Scaling Formula: (1 + 0.4*M + 0.1*M^1.5)
        const difficultyMultiplier = 1 + (gameMinutes * 0.4) + (Math.pow(gameMinutes, 1.5) * 0.1);
        
        // 2. Enemy Type Roll
        const roll = Math.random();
        let type = EntityType.ENEMY_SCOUT;
        if (roll > 0.90 && gameTime > 60) type = EntityType.ENEMY_LASER_SCOUT;
        else if (roll > 0.75) type = EntityType.ENEMY_STRIKER;

        // Elite Chance
        const isElite = Math.random() < Math.min(0.2, 0.01 + gameMinutes * 0.02);

        // Spawn Position (Offscreen)
        const a = Math.random() * Math.PI * 2;
        const d = 800 + Math.random() * 300;
        const x = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.x + Math.cos(a) * d));
        const y = Math.max(40, Math.min(WORLD_SIZE - 40, playerPosRef.current.y + Math.sin(a) * d));

        // Stats Calculation
        let baseHp = 100;
        let baseRadius = 22;
        let color = '#fff';

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
        }

        if (isElite) {
            baseHp *= 3;
            baseRadius *= 1.3;
            color = '#f0f'; // Elite color override
        }

        const maxShield = (isElite || (gameMinutes > 5 && Math.random() > 0.7)) ? baseHp * 0.5 : 0;

        enemiesRef.current.push({
            id: Math.random().toString(36),
            type: type,
            pos: { x, y }, vel: { x: 0, y: 0 },
            radius: baseRadius,
            health: baseHp, maxHealth: baseHp,
            shield: maxShield, maxShield: maxShield,
            color: color,
            isMelee: type === EntityType.ENEMY_STRIKER,
            level: Math.floor(difficultyMultiplier), // Fix: Level is now directly related to difficulty multiplier (1, 2, 3...)
            isElite: isElite, // Explicit elite flag
            aiPhase: Math.random() * Math.PI * 2, 
            aiSeed: Math.random(),
            lastHitTime: 0, lastShieldHitTime: 0,
            isCharging: false, isFiring: false, chargeProgress: 0, 
            lastShotTime: currentTime + Math.random() * 1000 // Random delay before first shot
        });
    }, [playerPosRef]);

    const updateEnemies = useCallback((dt: number, time: number, gameTime: number) => {
        // --- SPAWNING LOGIC ---
        // Rush Hour: Every 120s, spawn rate triples for 20s
        const cycleTime = 120;
        const rushDuration = 20;
        const timeInCycle = gameTime % cycleTime;
        const isRushHour = timeInCycle > (cycleTime - rushDuration);
        
        // Base spawn rate increases with time
        let spawnDelay = Math.max(0.1, 1.2 - (gameTime / 300)); // Cap at 0.1s
        if (isRushHour) spawnDelay /= 3;

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

            if (e.type === EntityType.ENEMY_SCOUT || e.type === EntityType.ENEMY_STRIKER || e.type === EntityType.ENEMY_LASER_SCOUT) {
                const dx = playerPos.x - e.pos.x, dy = playerPos.y - e.pos.y, d = Math.hypot(dx, dy);
                
                // Base Speed Scaling with Level (Time)
                const speedScale = 1 + (gameTime / 600) * 0.5; // +50% speed over 10 mins
                const baseSpd = (e.type === EntityType.ENEMY_STRIKER ? 110 : 80) * speedScale * speedMult;
                
                // Separation (Swarming)
                let sepX = 0, sepY = 0;
                enemiesRef.current.forEach(other => {
                    if (other.id === e.id) return;
                    if (Math.abs(other.pos.x - e.pos.x) > 80 || Math.abs(other.pos.y - e.pos.y) > 80) return; 
                    const odx = e.pos.x - other.pos.x, ody = e.pos.y - other.pos.y, od = Math.hypot(odx, ody);
                    if (od < e.radius + other.radius + 10) { 
                        sepX += (odx / od) * 150; sepY += (ody / od) * 150; 
                    }
                });

                // --- AI BEHAVIORS ---
                
                // 1. Laser Scout: Natural Orbiting & Kiting
                if (e.type === EntityType.ENEMY_LASER_SCOUT) {
                    const optimalRange = 600; 
                    const orbitDir = (e.aiSeed || 0) > 0.5 ? 1 : -1;
                    
                    // --- Natural Movement Calculation ---
                    let moveX = 0; 
                    let moveY = 0;

                    if (d > optimalRange) {
                        moveX += (dx / d) * baseSpd * 1.0;
                        moveY += (dy / d) * baseSpd * 1.0;
                    } else {
                        moveX += (-dx / d) * baseSpd * 1.2; 
                        moveY += (-dy / d) * baseSpd * 1.2;
                    }

                    moveX += (-dy / d) * baseSpd * 0.8 * orbitDir;
                    moveY += (dx / d) * baseSpd * 0.8 * orbitDir;
                    moveX += sepX;
                    moveY += sepY;

                    // Stop completely during charge/fire to allow dodging
                    if (e.isFiring || e.isCharging) {
                        e.vel.x = 0;
                        e.vel.y = 0;
                    } else {
                        e.vel.x = moveX;
                        e.vel.y = moveY;
                    }

                    // --- Firing Logic ---
                    if (!e.isCharging && !e.isFiring && (time - (e.lastShotTime || 0) > 4000) && d < 850) {
                        e.isCharging = true; e.chargeProgress = 0; e.angle = Math.atan2(dy, dx);
                    }
                    if (e.isCharging) {
                        // Track player for first 50% of charge (1 second), then lock (1 second warning)
                        if ((e.chargeProgress || 0) < 0.5) {
                            const targetAngle = Math.atan2(dy, dx);
                            let angleDiff = targetAngle - (e.angle || 0);
                            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                            e.angle = (e.angle || 0) + angleDiff * 0.1; 
                        }
                        
                        e.chargeProgress = (e.chargeProgress || 0) + dt * 0.5; // 2.0s total charge duration
                        if (e.chargeProgress >= 1.0) { e.isCharging = false; e.isFiring = true; e.chargeProgress = 0; e.lastShotTime = time; }
                    }
                    if (e.isFiring) {
                        e.chargeProgress = (e.chargeProgress || 0) + dt * 2.0; 
                        if (e.chargeProgress >= 1.0) { e.isFiring = false; e.chargeProgress = 0; }
                    }
                
                // 2. Striker: Dash
                } else if (e.isMelee) {
                    if (d < 250 && !e.isDashing && time - (e.lastShotTime || 0) > 5000) {
                        e.isDashing = true;
                        e.dashUntil = time + 600; 
                        e.lastShotTime = time; 
                        e.vel.x = (dx/d) * baseSpd * 3.5;
                        e.vel.y = (dy/d) * baseSpd * 3.5;
                    }
                    if (e.isDashing) {
                        if (time > (e.dashUntil || 0)) e.isDashing = false;
                    } else {
                        const pulse = 1.0 + Math.sin(time * 0.005 + (e.aiPhase || 0)) * 0.2;
                        e.vel.x = (dx / d) * baseSpd * pulse + sepX;
                        e.vel.y = (dy / d) * baseSpd * pulse + sepY;
                    }

                // 3. Basic Scout: Swarm Orbiting
                } else {
                    const orbitRadius = 320 + (e.aiSeed || 0) * 100;
                    const idealAngle = (e.aiSeed || 0) * Math.PI * 2 + (time * 0.0003); 
                    
                    const tx = playerPos.x + Math.cos(idealAngle) * orbitRadius;
                    const ty = playerPos.y + Math.sin(idealAngle) * orbitRadius;
                    
                    const toTX = tx - e.pos.x, toTY = ty - e.pos.y, distT = Math.hypot(toTX, toTY);
                    
                    e.vel.x = (toTX / distT) * baseSpd + sepX; 
                    e.vel.y = (toTY / distT) * baseSpd + sepY;

                    if (d < 600) {
                         if (time - (e.lastShotTime || 0) > 2500 + (e.aiSeed || 0) * 500) {
                            e.lastShotTime = time;
                            const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.25;
                            enemyBulletsToSpawn.push({ 
                                id: Math.random().toString(36), 
                                type: EntityType.ENEMY_BULLET, 
                                pos: { ...e.pos }, 
                                vel: { x: Math.cos(a) * 320, y: Math.sin(a) * 320 }, 
                                radius: 7, 
                                health: 1, 
                                maxHealth: 1, 
                                color: '#f97316', 
                                level: e.level 
                            });
                        }
                    }
                }
                
                e.pos.x += e.vel.x * dt; 
                e.pos.y += e.vel.y * dt;

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
