
import { Entity, EntityType, PlayerStats, Vector2D, WeaponType, ShipType, GameState } from '../types';
import { SHIPS, WORLD_SIZE, LASER_LENGTH } from '../constants';
import { POWER_UPS } from '../systems/PowerUpSystem';
import { renderEnemies, getAsteroidPoints } from './EnemyRenderer';

// --- Sub-renderers ---

const renderPickups = (ctx: CanvasRenderingContext2D, pickups: Entity[], time: number) => {
    pickups.forEach(e => {
        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);

        if (e.type === EntityType.XP_GEM) {
            ctx.shadowBlur = 15; ctx.shadowColor = '#06b6d4';
            ctx.rotate(time / 150);
            ctx.fillStyle = '#fff'; ctx.fillRect(-9, -9, 18, 18);
            ctx.fillStyle = '#06b6d4'; ctx.fillRect(-6, -6, 12, 12);
        } else if (e.type === EntityType.CREDIT) {
            ctx.shadowBlur = 15; ctx.shadowColor = '#fbbf24';
            ctx.rotate(time / 100);
            ctx.fillStyle = '#fbbf24'; ctx.beginPath();
            ctx.moveTo(0, -14); ctx.lineTo(14, 0); ctx.lineTo(0, 14); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        } else if (e.type === EntityType.POWERUP && e.powerUpId) {
            const config = POWER_UPS[e.powerUpId];
            if (config) {
                const pulse = 1 + Math.sin(time * 0.01) * 0.15;
                ctx.rotate(time * 0.002);
                ctx.shadowBlur = 25; ctx.shadowColor = config.color;
                ctx.fillStyle = '#fff'; ctx.strokeStyle = config.color; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.rect(-18 * pulse, -18 * pulse, 36 * pulse, 36 * pulse); ctx.fill(); ctx.stroke();

                ctx.fillStyle = '#000'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(config.label, 0, 0);
            }
        }
        ctx.restore();
    });
};
// renderEnemies imported from EnemyRenderer.ts

const renderProjectiles = (ctx: CanvasRenderingContext2D, projectiles: Entity[], stats: PlayerStats, time: number) => {
    projectiles.forEach(e => {
        if (e.health <= 0) return;

        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);

        // Angle Calculation
        let angle = Math.atan2(e.vel.y, e.vel.x);
        if (e.weaponType === WeaponType.LASER) {
            angle = e.angle || 0;
        }

        // Render Trail
        if (!e.isCharging && e.type === EntityType.BULLET && e.weaponType !== WeaponType.LASER) {
            ctx.save();
            ctx.rotate(angle + Math.PI);
            const trailLen = 40;
            const tGrad = ctx.createLinearGradient(0, 0, trailLen, 0);
            tGrad.addColorStop(0, e.color);
            tGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = tGrad;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(0, -e.radius / 2, trailLen, e.radius);
            ctx.restore();
        }

        // Render Enemy Homing Trail (Boss Missile)
        if (e.type === EntityType.ENEMY_BULLET && e.isHoming) {
            ctx.save();
            ctx.rotate(angle + Math.PI);
            const trailLen = 50;
            const tGrad = ctx.createLinearGradient(0, 0, trailLen, 0);
            tGrad.addColorStop(0, '#a1a1aa'); // Smoky Grey
            tGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = tGrad;
            ctx.globalAlpha = 0.5;
            // Draw slightly wider trail for smoke
            ctx.fillRect(0, -e.radius / 1.5, trailLen, e.radius * 1.3);
            ctx.restore();
        }

        // Player Laser Rendering
        if (e.weaponType === WeaponType.LASER) {
            ctx.rotate(angle);

            if (e.isCharging) {
                const prog = e.chargeProgress || 0;
                ctx.strokeStyle = `rgba(168, 85, 247, ${0.2 + prog * 0.4})`; // Purple
                ctx.lineWidth = 1 + prog * 2;
                ctx.setLineDash([20, 15]);
                ctx.beginPath();
                ctx.moveTo(30, 0);
                ctx.lineTo(LASER_LENGTH, 0);
                ctx.stroke();

                ctx.shadowBlur = 10 + prog * 20;
                ctx.shadowColor = '#d8b4fe';
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.arc(20, 0, 5 + prog * 8, 0, Math.PI * 2);
                ctx.fill();

            } else if (e.isFiring) {
                const duration = e.duration || 0;
                const maxDur = stats.laserDuration || 0.3;
                const life = duration / maxDur;
                const width = Math.max(0, 40 * (1 - life));

                ctx.shadowBlur = 60; ctx.shadowColor = '#a855f7';
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, -width / 4, LASER_LENGTH, width / 2);

                ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
                ctx.fillRect(0, -width, LASER_LENGTH, width * 2);

                ctx.beginPath();
                ctx.fillStyle = '#fff';
                ctx.arc(20, 0, width * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
            return;
        }

        ctx.rotate(angle + Math.PI / 2);

        if (e.type === EntityType.BULLET) {
            if (e.weaponType === WeaponType.MISSILE) {
                ctx.shadowBlur = 20; ctx.shadowColor = e.color;
                ctx.fillStyle = e.color; ctx.fillRect(-8, -20, 16, 40);
                // Engine fire
                ctx.fillStyle = '#fff'; ctx.fillRect(-4, 20, 8, 10);
            } else if (e.weaponType === WeaponType.SWARM_LAUNCHER) {
                ctx.shadowBlur = 10; ctx.shadowColor = e.color;
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.lineTo(5, 5);
                ctx.lineTo(-5, 5);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(-2, 5, 4, 6);
            } else {
                ctx.shadowBlur = 15; ctx.shadowColor = e.color;
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = e.color; ctx.lineWidth = 3; ctx.stroke();
            }
        } else if (e.type === EntityType.ENEMY_BULLET) {
            ctx.shadowBlur = 20; ctx.shadowColor = e.color || '#f97316';

            if (e.isHoming) {
                // Rocket shape for enemy missiles
                ctx.fillStyle = e.color || '#f97316';
                ctx.fillRect(-3, -8, 6, 16);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-2, 8, 4, 4); // Thruster
            } else {
                // Plasma blob
                if (e.radius > 10) {
                    // Heavy Plasma (Boss)
                    ctx.shadowBlur = 40;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(0, 0, e.radius * 0.7, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = e.color;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath(); ctx.arc(0, 0, e.radius * 1.2, 0, Math.PI * 2); ctx.fill();
                    ctx.globalAlpha = 1.0;
                } else {
                    // Standard Plasma
                    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = e.color || '#f97316'; ctx.lineWidth = 2; ctx.stroke();
                }
            }
        }
        ctx.restore();
    });
};

const renderParticles = (ctx: CanvasRenderingContext2D, particles: Entity[]) => {
    particles.forEach(e => {
        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);

        if (e.type === EntityType.DAMAGE_NUMBER) {
            const prog = (e.duration || 0) / (e.maxDuration || 0.8);
            ctx.globalAlpha = Math.max(0, 1 - Math.pow(prog, 2));
            ctx.scale(1 + (1 - prog) * 0.5, 1 + (1 - prog) * 0.5);
            ctx.fillStyle = e.color || '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.font = '900 36px Arial, sans-serif';
            ctx.textAlign = 'center';
            const txt = e.value?.toString() || '0';
            ctx.strokeText(txt, 0, 0);
            ctx.fillText(txt, 0, 0);

        } else if (e.type === EntityType.EXPLOSION) {
            const prog = (e.duration || 0) / (e.maxDuration || 0.5);
            const fade = Math.max(0, 1 - prog);
            const seed = (e.id.charCodeAt(0) || 0) + (e.id.charCodeAt(e.id.length - 1) || 0);

            // 1. Shockwave Ring
            ctx.beginPath();
            ctx.arc(0, 0, e.radius * (0.2 + prog * 1.2), 0, Math.PI * 2);
            ctx.strokeStyle = e.color;
            ctx.lineWidth = (1 - prog) * 4;
            ctx.globalAlpha = fade;
            ctx.stroke();

            // 2. Central Flash (Quick)
            if (prog < 0.3) {
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = (0.3 - prog) * 3;
                ctx.beginPath(); ctx.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2); ctx.fill();
            }

            // 3. Procedural Debris (Performance optimized)
            // Instead of simulating 8 separate entities, calculate their position mathematically
            ctx.globalAlpha = fade;
            ctx.fillStyle = e.color;

            // Generate 6-8 shards based on entity hash
            const shardCount = 6 + (seed % 4);
            const speed = e.radius * 2.5; // Debris moves proportional to explosion size

            for (let i = 0; i < shardCount; i++) {
                // Deterministic angle based on index and seed
                const angle = (i / shardCount) * Math.PI * 2 + (seed * 0.1);

                // Distance travels over time
                const dist = prog * speed * (0.8 + (i % 3) * 0.2); // slight variance in speed

                const dx = Math.cos(angle) * dist;
                const dy = Math.sin(angle) * dist;

                // Draw shard (Rect is faster than Arc)
                const size = (e.radius * 0.15) * fade;
                ctx.fillRect(dx - size / 2, dy - size / 2, size, size);
            }
        } else if (e.type === EntityType.SPAWN_FLASH) {
            const prog = (e.duration || 0) / (e.maxDuration || 0.5);
            const scale = Math.sin(prog * Math.PI); // Grow then shrink slightly? No, just grow and fade

            // Hyperspace Flash Effect
            // Quick expansion from 0 to large, then fade out

            // 1. Bright Core
            ctx.globalAlpha = Math.max(0, 1 - prog);
            ctx.shadowBlur = 40; ctx.shadowColor = '#fff';
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, e.radius * prog, 0, Math.PI * 2);
            ctx.fill();

            // 2. Cross Streak
            if (prog < 0.5) {
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#22d3ee';
                const w = e.radius * 2 * prog;
                const h = 4 * (1 - prog);
                ctx.fillRect(-w / 2, -h / 2, w, h);
                ctx.fillRect(-h / 2, -w / 2, h, w);
            }

            // 3. Shockwave Ring
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 4 * (1 - prog);
            ctx.beginPath();
            ctx.arc(0, 0, e.radius * 1.5 * prog, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    });
};

const renderPlayer = (ctx: CanvasRenderingContext2D, playerPos: Vector2D, joystickDir: Vector2D, aimDir: Vector2D, stats: PlayerStats, time: number, lastHitTime: number, gameState?: GameState) => {
    // IF DYING, DO NOT RENDER SHIP
    if (gameState === GameState.DYING) return;

    const hitAge = time - lastHitTime;
    const isHitActive = hitAge < 250;
    const isBoostActive = time < stats.moduleActiveUntil;

    ctx.save();
    ctx.translate(playerPos.x, playerPos.y);

    // --- BOOST TRAIL (Afterburner) ---
    if (isBoostActive) {
        ctx.save();
        // Rotate to trail behind movement
        let moveAngle = Math.atan2(joystickDir.y, joystickDir.x);
        if (joystickDir.x === 0 && joystickDir.y === 0) {
            // If not moving, trail behind facing direction
            moveAngle = Math.atan2(aimDir.y, aimDir.x);
        }
        ctx.rotate(moveAngle + Math.PI); // Point backwards

        // Draw multiple long streaks
        const length = 120 + Math.random() * 40;
        const width = 25;
        const grad = ctx.createLinearGradient(0, 0, length, 0);
        grad.addColorStop(0, 'rgba(217, 70, 239, 0.8)'); // Fuchsia start
        grad.addColorStop(1, 'rgba(217, 70, 239, 0)');   // Fade out

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -width / 2);
        ctx.lineTo(length, 0);
        ctx.lineTo(0, width / 2);
        ctx.fill();

        ctx.restore();
    }

    // --- AIM RETICLE ---
    if (Math.abs(aimDir.x) > 0.1 || Math.abs(aimDir.y) > 0.1) {
        const aimAngle = Math.atan2(aimDir.y, aimDir.x);
        ctx.save();
        ctx.rotate(aimAngle);

        // Dashed Laser Line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)'; // Faint Cyan
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]); // Dashed
        ctx.moveTo(35, 0); // Start outside ship
        ctx.lineTo(250, 0); // Draw out
        ctx.stroke();

        // Reticle End Marker (Chevron)
        ctx.setLineDash([]);
        ctx.shadowBlur = 10; ctx.shadowColor = '#22d3ee';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Chevron shape at end of line
        ctx.moveTo(240, -10);
        ctx.lineTo(255, 0);
        ctx.lineTo(240, 10);
        ctx.stroke();

        ctx.restore();
    }

    // --- PLAYER SHIP ROTATION ---
    if (joystickDir.x !== 0 || joystickDir.y !== 0) {
        ctx.rotate(Math.atan2(joystickDir.y, joystickDir.x) + Math.PI / 2);
    } else {
        if (Math.abs(aimDir.x) > 0.1 || Math.abs(aimDir.y) > 0.1) {
            ctx.rotate(Math.atan2(aimDir.y, aimDir.x) + Math.PI / 2);
        }
    }

    // Shield
    if (stats.currentShield >= 1.0) {
        const shieldRatio = stats.currentShield / stats.maxShield;
        const r = 58 * (1 + Math.sin(time * 0.01) * 0.04);
        ctx.strokeStyle = shieldRatio < 0.25 ? `rgba(255, 50, 50, ${0.5 + Math.sin(time * 0.02) * 0.3})` : 'rgba(34, 211, 238, 0.6)';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 25; ctx.shadowColor = shieldRatio < 0.25 ? '#ff0000' : '#00ffff';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();

        // Hex pattern simulation
        if (shieldRatio > 0.1) {
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#22d3ee';
            ctx.beginPath(); ctx.arc(0, 0, r - 5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    const sColor = SHIPS.find(s => s.type === stats.shipType)?.color || '#22d3ee';
    ctx.shadowBlur = 30; ctx.shadowColor = sColor;

    // Thrusters visual
    if (Math.abs(joystickDir.x) > 0.1 || Math.abs(joystickDir.y) > 0.1 || isBoostActive) {
        ctx.fillStyle = isBoostActive ? '#d946ef' : '#fff'; // Pink if boosting
        const tLen = (15 + Math.random() * 15) * (isBoostActive ? 2 : 1);
        ctx.fillRect(-10, 20, 5, tLen);
        ctx.fillRect(5, 20, 5, tLen);
    }

    ctx.fillStyle = isHitActive ? '#ffffff' : sColor;
    ctx.beginPath();
    ctx.moveTo(0, -30); ctx.lineTo(-25, 25); ctx.lineTo(0, 15); ctx.lineTo(25, 25);
    ctx.closePath(); ctx.fill();

    // Cockpit
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(0, -5, 8, 12, 0, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
};

export const renderGame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    enemies: (Entity | import('../types/enemies').IEnemy)[],
    projectiles: Entity[],
    pickups: Entity[],
    particles: Entity[],
    playerPos: Vector2D,
    cameraPos: Vector2D,
    stats: PlayerStats,
    joystickDir: Vector2D,
    aimDir: Vector2D,
    time: number,
    lastPlayerHitTime: number,
    zoomLevel: number,
    gameState: GameState
) => {
    const sCX = canvas.width / 2;
    const sCY = canvas.height / 2;

    const hitAge = time - lastPlayerHitTime;
    const isHitActive = hitAge < 250;
    const hitIntensity = isHitActive ? 1 - (hitAge / 250) : 0;

    ctx.save();
    ctx.translate(sCX, sCY);

    // Add screen shake on death
    if (gameState === GameState.DYING) {
        const shake = 15;
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    } else if (isHitActive) {
        const shakeAmount = hitIntensity * 20;
        ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
    }

    // Dynamic Zoom Application
    // Zoom out slightly more when boosting
    const boostZoom = (time < stats.moduleActiveUntil) ? 0.9 : 1.0;
    ctx.scale(zoomLevel * boostZoom, zoomLevel * boostZoom);

    ctx.translate(-cameraPos.x, -cameraPos.y);

    // 1. Boundary Neon Wall
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 12;
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#06b6d4';
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Internal boundary glow
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -20, WORLD_SIZE + 40, WORLD_SIZE + 40);

    // 2. Render Layers
    renderPickups(ctx, pickups, time);
    renderEnemies(ctx, enemies, time);
    renderProjectiles(ctx, projectiles, stats, time);
    renderParticles(ctx, particles); // Moved above player so player flies through smoke/fire
    renderPlayer(ctx, playerPos, joystickDir, aimDir, stats, time, lastPlayerHitTime, gameState);

    ctx.restore();
};
