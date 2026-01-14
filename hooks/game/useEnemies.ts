
import { useRef, useCallback } from 'react';
import { Entity, EntityType, Vector2D } from '../../types';
import { WORLD_SIZE } from '../../constants';

export const useEnemies = (
    playerPosRef: React.MutableRefObject<Vector2D>
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
                radius: r, health: r * 5, maxHealth: r * 5, color: '#475569', seed: Math.random(),
                lastHitTime: 0
            });
        }
    }, []);

    const spawnEnemy = useCallback((gameTime: number, currentTime: number) => {
        const gameMinutes = gameTime / 60;
        
        // 1. Difficulty Scaling
        const difficultyMultiplier = 1 + (gameMinutes * 0.4) + (Math.pow(gameMinutes, 1.5) * 0.1);

        // --- BOSS SPAWNING LOGIC ---
        // Spawn a boss every 3 minutes (180 seconds)
        const bossInterval = 180;
        const currentBossWave = Math.floor(gameTime / bossInterval);
        
        if (currentBossWave > lastBossWaveRef.current) {
            lastBossWaveRef.current = currentBossWave;
            
            // Spawn Boss
            const a = Math.random() * Math.PI * 2;
            const d = 900;
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
                level: Math.floor(difficultyMultiplier) + 5,
                isBoss: true,
                aiPhase: 0,
                lastHitTime: 0, lastShieldHitTime: 0,
                isCharging: false, isFiring: false, chargeProgress: 0,
                lastShotTime: currentTime + 2000 // Initial delay
            });
            
            // Don't spawn other enemies this frame
            return;
        }

        // 2. Normal Enemy Type Roll
        const roll = Math.random();
        let type = EntityType.ENEMY_SCOUT;
        if (roll > 0.90 && gameTime > 60) type = EntityType.ENEMY_LASER_SCOUT;
        else if (roll > 0.75) type = EntityType.ENEMY_STRIKER;

        // 3. Miniboss & Elite Logic
        const activeMinibosses = enemiesRef.current.filter(e => e.isMiniboss).length;
        const allowMiniboss = gameTime > 90 && activeMinibosses < 2;

        let isMiniboss = false;
        let isElite = Math.random() < Math.min(0.2, 0.01 + gameMinutes * 0.02);

        if (allowMiniboss && Math.random() < 0.03) { 
            isMiniboss = true;
            isElite = false; 
        }

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

        if (isMiniboss) {
            baseHp *= 12;
            baseRadius *= 2.0;
            color = '#ef4444';
        } else if (isElite) {
            baseHp *= 3;
            baseRadius *= 1.3;
            color = '#f0f';
        }

        const maxShield = (isMiniboss || isElite || (gameMinutes > 5 && Math.random() > 0.7)) ? baseHp * 0.5 : 0;

        enemiesRef.current.push({
            id: Math.random().toString(36),
            type: type,
            pos: { x, y }, vel: { x: 0, y: 0 },
            radius: baseRadius,
            health: baseHp, maxHealth: baseHp,
            shield: maxShield, maxShield: maxShield,
            color: color,
            isMelee: type === EntityType.ENEMY_STRIKER,
            level: Math.floor(difficultyMultiplier), 
            isElite: isElite, 
            isMiniboss: isMiniboss,
            aiPhase: Math.random() * Math.PI * 2, 
            aiSeed: Math.random(),
            lastHitTime: 0, lastShieldHitTime: 0,
            isCharging: false, isFiring: false, chargeProgress: 0, 
            lastShotTime: currentTime + Math.random() * 1000
        });
    }, [playerPosRef]);

    const updateEnemies = useCallback((dt: number, time: number, gameTime: number) => {
        // --- SPAWNING LOGIC ---
        const cycleTime = 120;
        const rushDuration = 20;
        const timeInCycle = gameTime % cycleTime;
        const isRushHour = timeInCycle > (cycleTime - rushDuration);
        
        let spawnDelay = Math.max(0.1, 1.2 - (gameTime / 300));
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
            
            const dx = playerPos.x - e.pos.x, dy = playerPos.y - e.pos.y, d = Math.hypot(dx, dy);

            if (e.type === EntityType.ENEMY_BOSS) {
                // --- BOSS AI ---
                const bossSpeed = 40 * speedMult; // Very slow
                
                // Move towards player slowly, but stop if too close or firing
                if (d > 400 && !e.isFiring) {
                    e.vel.x = (dx / d) * bossSpeed;
                    e.vel.y = (dy / d) * bossSpeed;
                } else {
                    e.vel.x *= 0.95; // Drag
                    e.vel.y *= 0.95;
                }

                e.pos.x += e.vel.x * dt;
                e.pos.y += e.vel.y * dt;

                // Rotation: Always face player slowly
                const targetAngle = Math.atan2(dy, dx);
                let currentAngle = e.angle || 0;
                let angleDiff = targetAngle - currentAngle;
                
                // Angle Wrapping
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                // Slow rotation speed (Reduced from 2.0 to 0.8 for easier dodging)
                e.angle = currentAngle + angleDiff * 0.8 * dt;

                // Firing Logic
                if (!e.isCharging && !e.isFiring && (time - (e.lastShotTime || 0) > 6000)) {
                    // Start Charge
                    e.isCharging = true;
                    e.chargeProgress = 0;
                }

                if (e.isCharging) {
                    e.chargeProgress = (e.chargeProgress || 0) + dt * 0.4; // 2.5s Charge
                    if (e.chargeProgress >= 1.0) {
                        e.isCharging = false;
                        e.isFiring = true;
                        e.chargeProgress = 0;
                        e.lastShotTime = time;
                    }
                }

                if (e.isFiring) {
                    // Fire for 3 seconds
                    e.chargeProgress = (e.chargeProgress || 0) + dt * 0.33;
                    if (e.chargeProgress >= 1.0) {
                        e.isFiring = false;
                        e.chargeProgress = 0;
                    }
                }

            } else if (e.type === EntityType.ENEMY_SCOUT || e.type === EntityType.ENEMY_STRIKER || e.type === EntityType.ENEMY_LASER_SCOUT) {
                // ... (Existing Logic for standard enemies) ...
                
                // Base Speed Scaling with Level (Time)
                const speedScale = 1 + (gameTime / 600) * 0.5; // +50% speed over 10 mins
                let baseSpd = (e.type === EntityType.ENEMY_STRIKER ? 110 : 80) * speedScale * speedMult;
                
                if (e.isMiniboss) baseSpd *= 0.65;

                // Separation (Swarming)
                let sepX = 0, sepY = 0;
                enemiesRef.current.forEach(other => {
                    if (other.id === e.id) return;
                    if (Math.abs(other.pos.x - e.pos.x) > (e.radius + other.radius + 50)) return; 
                    const odx = e.pos.x - other.pos.x, ody = e.pos.y - other.pos.y, od = Math.hypot(odx, ody);
                    if (od < e.radius + other.radius + 10) { 
                        sepX += (odx / od) * 150; sepY += (ody / od) * 150; 
                    }
                });

                // --- AI BEHAVIORS ---
                
                if (e.type === EntityType.ENEMY_LASER_SCOUT) {
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
                        e.chargeProgress = (e.chargeProgress || 0) + dt * 2.0; 
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
                } else {
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
