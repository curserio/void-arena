
import { Entity, EntityType, PlayerStats, Vector2D, GameState } from '../types';
import { WORLD_SIZE } from '../constants';
import { POWER_UPS } from '../systems/PowerUpSystem';
import { renderEnemies } from './EnemyRenderer';
import { renderPlayer } from './PlayerRenderer';
import { renderProjectiles } from './ProjectileRenderer';

// --- Sub-renderers ---

export const renderPickups = (ctx: CanvasRenderingContext2D, pickups: Entity[], time: number) => {
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
