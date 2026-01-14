import { Entity, EntityType, PlayerStats, Vector2D, WeaponType, PowerUpType, ShipType } from '../types';
import { SHIPS, GAME_ZOOM, WORLD_SIZE } from '../constants';

// --- Helpers ---
const getAsteroidPoints = (seed: number, radius: number) => {
    const points: Vector2D[] = [];
    const segments = 10;
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const noise = Math.sin(seed * 123.45 + angle * 67.89) * 0.3 + 1;
        points.push({
            x: Math.cos(angle) * radius * noise,
            y: Math.sin(angle) * radius * noise
        });
    }
    return points;
};

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
        } else if (e.type === EntityType.POWERUP) {
            const pulse = 1 + Math.sin(time * 0.01) * 0.15;
            ctx.rotate(time * 0.002);
            ctx.shadowBlur = 25; ctx.shadowColor = '#0ff';
            ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0ff'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.rect(-18 * pulse, -18 * pulse, 36 * pulse, 36 * pulse); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#000'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            let txt = '?';
            if (e.powerUpType === PowerUpType.OVERDRIVE) { txt = 'F'; ctx.shadowColor = '#f0f'; ctx.strokeStyle = '#f0f'; }
            if (e.powerUpType === PowerUpType.OMNI_SHOT) { txt = 'M'; ctx.shadowColor = '#fbbf24'; ctx.strokeStyle = '#fbbf24'; }
            if (e.powerUpType === PowerUpType.SUPER_PIERCE) { txt = 'P'; ctx.shadowColor = '#22d3ee'; ctx.strokeStyle = '#22d3ee'; }
            ctx.fillText(txt, 0, 0);
        }
        ctx.restore();
    });
};

const renderEnemies = (ctx: CanvasRenderingContext2D, enemies: Entity[], time: number) => {
    enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);

        // ASTEROID
        if (e.type === EntityType.ASTEROID) {
            const isRecentlyHit = (time - (e.lastHitTime || 0)) < 80;
            const pts = getAsteroidPoints(e.seed || 0, e.radius);
            ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.closePath();
            const grad = ctx.createRadialGradient(-e.radius * 0.3, -e.radius * 0.3, 0.1, 0, 0, Math.max(0.1, e.radius));
            grad.addColorStop(0, isRecentlyHit ? '#ffffff' : '#64748b'); grad.addColorStop(1, isRecentlyHit ? '#ffffff' : '#1e293b');
            ctx.fillStyle = grad; ctx.fill();
            ctx.strokeStyle = isRecentlyHit ? '#ffffff' : '#94a3b8'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.restore();
            return;
        }

        // OTHER ENEMIES
        const isRecentlyHit = (time - (e.lastHitTime || 0)) < 80;
        const isShieldHit = (time - (e.lastShieldHitTime || 0)) < 120;
        const isElite = (e.level || 1) > 4;

        // Draw Health Bars & Labels
        ctx.save();
        const hudY = -e.radius - 20;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        // Only draw text if near camera center or if simplified? 
        // Drawing text is expensive. Maybe only if hovered or elite? 
        // For now keep original logic but optimized.
        // Actually, let's keep it.
        ctx.fillStyle = isElite ? '#f0f' : '#fff';
        // ctx.shadowBlur = 0; // Disable shadow for text/bars to save perf?
        // Original had global shadow from restore? No.

        ctx.fillText(`Lv.${e.level}`, 0, hudY - 15); // Simplified label

        const barW = 60; const barH = 5; const barX = -barW / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(barX, hudY - 5, barW, barH);
        const hpRatio = Math.max(0, e.health / e.maxHealth);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(barX, hudY - 5, barW * hpRatio, barH);
        if (e.maxShield && e.maxShield > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(barX, hudY, barW, barH);
            const shRatio = Math.max(0, (e.shield || 0) / e.maxShield);
            ctx.fillStyle = '#22d3ee'; ctx.fillRect(barX, hudY, barW * shRatio, barH);
        }
        ctx.restore();

        // Laser Scout Beam
        if (e.type === EntityType.ENEMY_LASER_SCOUT && (e.isFiring || e.isCharging)) {
            ctx.save();
            ctx.rotate(e.angle || 0);
            if (e.isCharging) {
                const prog = e.chargeProgress || 0;
                ctx.strokeStyle = `rgba(255, 0, 0, ${0.1 + prog * 0.6})`;
                ctx.lineWidth = 1 + prog * 2;
                ctx.setLineDash([15, 8]);
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1000, 0); ctx.stroke();
            }
            if (e.isFiring) {
                const prog = e.chargeProgress || 0;
                const width = 25 * (1 - prog);
                ctx.shadowBlur = 40; ctx.shadowColor = '#f00';
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, -width / 2, 1000, width);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.fillRect(0, -width, 1000, width * 2);
            }
            ctx.restore();
        }

        // Body Rotation
        if (e.type === EntityType.ENEMY_LASER_SCOUT && (e.isCharging || e.isFiring)) {
            ctx.rotate((e.angle || 0) + Math.PI / 2);
        } else {
            ctx.rotate(Math.atan2(e.vel.y, e.vel.x) + Math.PI / 2);
        }

        // Draw Body
        ctx.shadowBlur = 15; ctx.shadowColor = e.color;
        if (isShieldHit) ctx.fillStyle = '#99f6ff';
        else ctx.fillStyle = isRecentlyHit ? '#ffffff' : e.color;

        if (e.type === EntityType.ENEMY_SCOUT) {
            ctx.beginPath();
            ctx.moveTo(0, -e.radius); ctx.lineTo(-e.radius * 0.8, e.radius * 0.5);
            ctx.lineTo(-e.radius * 0.3, e.radius * 0.3); ctx.lineTo(0, e.radius * 0.8);
            ctx.lineTo(e.radius * 0.3, e.radius * 0.3); ctx.lineTo(e.radius * 0.8, e.radius * 0.5);
            ctx.closePath(); ctx.fill();
        } else if (e.type === EntityType.ENEMY_LASER_SCOUT) {
            ctx.beginPath();
            ctx.moveTo(0, -e.radius * 1.2); ctx.lineTo(-e.radius * 0.5, e.radius * 0.5);
            ctx.lineTo(0, e.radius * 0.2); ctx.lineTo(e.radius * 0.5, e.radius * 0.5);
            ctx.closePath(); ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -e.radius); ctx.lineTo(-e.radius, 0);
            ctx.lineTo(-e.radius * 0.8, e.radius); ctx.lineTo(0, e.radius * 0.4);
            ctx.lineTo(e.radius * 0.8, e.radius); ctx.lineTo(e.radius, 0);
            ctx.closePath(); ctx.fill();
        }

        // Shield Aura
        if (e.shield !== undefined && e.shield > 0) {
            const sPulse = 1 + Math.sin(time * 0.01) * 0.05;
            const shRad = e.radius * 1.25 * sPulse;
            ctx.shadowBlur = isShieldHit ? 30 : 10;
            ctx.shadowColor = isShieldHit ? '#0ff' : '#22d3ee';
            ctx.strokeStyle = isShieldHit ? '#fff' : 'rgba(34, 211, 238, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, shRad, 0, Math.PI * 2); ctx.stroke();
        }

        ctx.restore();
    });
};

const renderProjectiles = (ctx: CanvasRenderingContext2D, projectiles: Entity[], time: number) => {
    projectiles.forEach(e => {
        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);

        if (e.type === EntityType.BULLET) {
            const bulletAngle = e.isCharging ? (e.angle || 0) : Math.atan2(e.vel.y, e.vel.x);
            ctx.rotate(bulletAngle + Math.PI / 2);

            if (e.weaponType === WeaponType.LASER) {
                if (e.isCharging) {
                    const prog = e.chargeProgress || 0;
                    ctx.shadowBlur = 10 + prog * 30; ctx.shadowColor = '#fff';
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                    // Simplify: Draw 1 ring instead of loop
                    ctx.beginPath(); ctx.arc(0, -35, Math.max(0, 22 * prog), 0, Math.PI * 2); ctx.fill();
                    // Actually stick to original look roughly
                    const sphereGrad = ctx.createRadialGradient(0, -35, 0.1, 0, -35, Math.max(0.2, 22 * prog));
                    sphereGrad.addColorStop(0, '#fff'); sphereGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = sphereGrad; ctx.fill();
                } else {
                    ctx.shadowBlur = 50; ctx.shadowColor = '#a855f7';
                    ctx.fillStyle = '#fff'; ctx.fillRect(-12, -150, 24, 300);
                }
            } else if (e.weaponType === WeaponType.MISSILE) {
                ctx.shadowBlur = 15; ctx.shadowColor = e.color;
                ctx.fillStyle = e.color; ctx.fillRect(-7, -18, 14, 36);
            } else {
                ctx.shadowBlur = 15; ctx.shadowColor = e.color;
                ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
            }
        } else if (e.type === EntityType.ENEMY_BULLET) {
            ctx.rotate(Math.atan2(e.vel.y, e.vel.x) + Math.PI / 2);
            ctx.shadowBlur = 20; ctx.shadowColor = '#f97316';
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
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
            const scale = prog < 0.2 ? 1 + (0.2 - prog) * 2.5 : 1;
            ctx.globalAlpha = 1 - Math.pow(prog, 2);
            ctx.scale(scale, scale);
            ctx.fillStyle = e.color || '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.font = '900 32px Arial, sans-serif';
            ctx.textAlign = 'center';
            const txt = e.value?.toString() || '0';
            ctx.strokeText(txt, 0, 0);
            ctx.fillText(txt, 0, 0);
        } else if (e.type === EntityType.EXPLOSION) {
            const prog = (e.duration || 0) / (e.maxDuration || 1);
            const r = Math.max(0.1, e.radius * (0.3 + Math.pow(prog, 0.5) * 0.7));
            const grad = ctx.createRadialGradient(0, 0, 0.1, 0, 0, r);
            grad.addColorStop(0, `rgba(255, 255, 255, ${1 - prog})`);
            grad.addColorStop(0.5, `rgba(255, 100, 0, ${(1 - prog) * 0.5})`);
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    });
};

const renderPlayer = (ctx: CanvasRenderingContext2D, playerPos: Vector2D, joystickDir: Vector2D, stats: PlayerStats, time: number, lastHitTime: number) => {
    const hitAge = time - lastHitTime;
    const isHitActive = hitAge < 250;

    ctx.save();
    ctx.translate(playerPos.x, playerPos.y);
    if (joystickDir.x !== 0 || joystickDir.y !== 0) ctx.rotate(Math.atan2(joystickDir.y, joystickDir.x) + Math.PI / 2);

    // Shield
    if (stats.currentShield >= 1.0) {
        const shieldRatio = stats.currentShield / stats.maxShield;
        const r = 55 * (1 + Math.sin(time * 0.01) * 0.03);
        ctx.strokeStyle = shieldRatio < 0.3 ? `rgba(255, 0, 0, ${0.4 + Math.sin(time * 0.02) * 0.3})` : 'rgba(34, 211, 238, 0.5)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20; ctx.shadowColor = shieldRatio < 0.3 ? '#f00' : '#0ff';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    }

    const sColor = SHIPS.find(s => s.type === stats.shipType)?.color || '#22d3ee';
    ctx.shadowBlur = 25; ctx.shadowColor = sColor;
    ctx.fillStyle = isHitActive ? '#ffffff' : sColor;
    ctx.beginPath();
    ctx.moveTo(0, -26); ctx.lineTo(-22, 22); ctx.lineTo(0, 12); ctx.lineTo(22, 22);
    ctx.closePath(); ctx.fill();
    ctx.restore();
};

export const renderGame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    // Separate Lists
    enemies: Entity[],
    projectiles: Entity[],
    pickups: Entity[],
    particles: Entity[],
    // Player
    playerPos: Vector2D,
    cameraPos: Vector2D,
    stats: PlayerStats,
    joystickDir: Vector2D,
    time: number,
    lastPlayerHitTime: number
) => {
    const sCX = canvas.width / 2;
    const sCY = canvas.height / 2;

    const hitAge = time - lastPlayerHitTime;
    const isHitActive = hitAge < 250;
    const hitIntensity = isHitActive ? 1 - (hitAge / 250) : 0;

    ctx.save();
    ctx.translate(sCX, sCY);
    if (isHitActive) {
        const shakeAmount = hitIntensity * 15;
        ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
    }
    ctx.scale(GAME_ZOOM, GAME_ZOOM);
    ctx.translate(-cameraPos.x, -cameraPos.y);

    // 1. Boundary
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 10;
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#06b6d4';
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // 2. Render Layers
    // Order matters for overlap
    renderPickups(ctx, pickups, time);
    renderEnemies(ctx, enemies, time);
    renderProjectiles(ctx, projectiles, time);
    renderPlayer(ctx, playerPos, joystickDir, stats, time, lastPlayerHitTime);
    renderParticles(ctx, particles);

    ctx.restore();
};
