
import { Entity, EntityType, PlayerStats, Vector2D, WeaponType, PowerUpType, ShipType } from '../types';
import { SHIPS, GAME_ZOOM, WORLD_SIZE } from '../constants';

// --- Helpers ---
const getAsteroidPoints = (seed: number, radius: number) => {
    const points: Vector2D[] = [];
    const segments = 12;
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const noise = Math.sin(seed * 123.45 + angle * 67.89) * 0.35 + 1;
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
            grad.addColorStop(0, isRecentlyHit ? '#ffffff' : '#4b5563'); 
            grad.addColorStop(1, isRecentlyHit ? '#ffffff' : '#111827');
            ctx.fillStyle = grad; ctx.fill();
            
            ctx.strokeStyle = isRecentlyHit ? '#ffffff' : '#6b7280'; 
            ctx.lineWidth = 2; ctx.stroke();
            
            // Texture/Cracks
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pts[0].x * 0.5, pts[0].y * 0.5);
            ctx.lineTo(pts[4].x * 0.2, pts[4].y * 0.2);
            ctx.stroke();

            ctx.restore();
            return;
        }

        // OTHER ENEMIES
        const hitAge = time - (e.lastHitTime || 0);
        const isRecentlyHit = hitAge < 80;
        const isShieldHit = (time - (e.lastShieldHitTime || 0)) < 120;
        const isElite = (e.level || 1) >= 5;

        // Health Bars & Stats
        ctx.save();
        const hudY = -e.radius - 20;
        
        if (isElite) {
            ctx.shadowBlur = 10; ctx.shadowColor = '#f0f';
            ctx.fillStyle = '#f0f';
            ctx.font = 'black 14px Arial';
            ctx.fillText("ELITE", 0, hudY - 25);
        }

        const barW = Math.max(40, e.radius * 2); 
        const barH = 4; const barX = -barW / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(barX, hudY - 5, barW, barH);
        const hpRatio = Math.max(0, e.health / e.maxHealth);
        ctx.fillStyle = hpRatio < 0.3 ? '#f87171' : '#ef4444'; 
        ctx.fillRect(barX, hudY - 5, barW * hpRatio, barH);
        
        if (e.maxShield && e.maxShield > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(barX, hudY, barW, barH);
            const shRatio = Math.max(0, (e.shield || 0) / e.maxShield);
            ctx.fillStyle = '#06fdfd'; ctx.fillRect(barX, hudY, barW * shRatio, barH);
        }
        ctx.restore();

        // Laser Scout Beam
        if (e.type === EntityType.ENEMY_LASER_SCOUT && (e.isFiring || e.isCharging)) {
            ctx.save();
            ctx.rotate(e.angle || 0);
            if (e.isCharging) {
                const prog = e.chargeProgress || 0;
                ctx.strokeStyle = `rgba(255, 0, 0, ${0.1 + prog * 0.6})`;
                ctx.lineWidth = 1 + prog * 3;
                ctx.setLineDash([20, 10]);
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1200, 0); ctx.stroke();
            }
            if (e.isFiring) {
                const prog = e.chargeProgress || 0;
                const width = 30 * (1 - prog);
                ctx.shadowBlur = 50; ctx.shadowColor = '#f00';
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, -width / 2, 1200, width);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                ctx.fillRect(0, -width, 1200, width * 2);
            }
            ctx.restore();
        }

        // Body Rotation and Draw
        if (e.type === EntityType.ENEMY_LASER_SCOUT && (e.isCharging || e.isFiring)) {
            ctx.rotate((e.angle || 0) + Math.PI / 2);
        } else {
            ctx.rotate(Math.atan2(e.vel.y, e.vel.x) + Math.PI / 2);
        }

        ctx.shadowBlur = isElite ? 25 : 15; 
        ctx.shadowColor = e.color;
        
        if (isShieldHit) ctx.fillStyle = '#ffffff';
        else if (isRecentlyHit) ctx.fillStyle = '#ff0000';
        else ctx.fillStyle = e.color;

        if (e.type === EntityType.ENEMY_SCOUT) {
            ctx.beginPath();
            ctx.moveTo(0, -e.radius); ctx.lineTo(-e.radius * 0.8, e.radius * 0.5);
            ctx.lineTo(-e.radius * 0.3, e.radius * 0.3); ctx.lineTo(0, e.radius * 0.8);
            ctx.lineTo(e.radius * 0.3, e.radius * 0.3); ctx.lineTo(e.radius * 0.8, e.radius * 0.5);
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
            const shRad = e.radius * 1.3;
            ctx.shadowBlur = isShieldHit ? 30 : 15;
            ctx.shadowColor = isShieldHit ? '#fff' : '#06fdfd';
            ctx.strokeStyle = isShieldHit ? '#fff' : 'rgba(6, 253, 253, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, shRad, 0, Math.PI * 2); ctx.stroke();
        }

        ctx.restore();
    });
};

const renderProjectiles = (ctx: CanvasRenderingContext2D, projectiles: Entity[], time: number) => {
    projectiles.forEach(e => {
        if (e.health <= 0) return;

        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);

        const angle = e.isCharging ? (e.angle || 0) : Math.atan2(e.vel.y, e.vel.x);
        
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
            ctx.fillRect(0, -e.radius/2, trailLen, e.radius);
            ctx.restore();
        }

        ctx.rotate(angle + Math.PI / 2);

        if (e.type === EntityType.BULLET) {
            if (e.weaponType === WeaponType.LASER) {
                if (e.isCharging) {
                    const prog = e.chargeProgress || 0;
                    ctx.shadowBlur = 20 + prog * 40; ctx.shadowColor = '#fff';
                    const sphereGrad = ctx.createRadialGradient(0, -35, 0.1, 0, -35, Math.max(1, 25 * prog));
                    sphereGrad.addColorStop(0, '#fff'); sphereGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = sphereGrad; ctx.beginPath(); ctx.arc(0, -35, Math.max(1, 25 * prog), 0, Math.PI*2); ctx.fill();
                } else {
                    ctx.shadowBlur = 50; ctx.shadowColor = '#a855f7';
                    ctx.fillStyle = '#fff'; ctx.fillRect(-15, -200, 30, 400);
                }
            } else if (e.weaponType === WeaponType.MISSILE) {
                ctx.shadowBlur = 20; ctx.shadowColor = e.color;
                ctx.fillStyle = e.color; ctx.fillRect(-8, -20, 16, 40);
                // Engine fire
                ctx.fillStyle = '#fff'; ctx.fillRect(-4, 20, 8, 10);
            } else {
                ctx.shadowBlur = 15; ctx.shadowColor = e.color;
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = e.color; ctx.lineWidth = 3; ctx.stroke();
            }
        } else if (e.type === EntityType.ENEMY_BULLET) {
            ctx.shadowBlur = 20; ctx.shadowColor = '#f97316';
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.stroke();
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
            ctx.globalAlpha = 1 - Math.pow(prog, 2);
            ctx.scale(1 + (1-prog)*0.5, 1 + (1-prog)*0.5);
            ctx.fillStyle = e.color || '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.font = '900 36px Arial, sans-serif';
            ctx.textAlign = 'center';
            const txt = e.value?.toString() || '0';
            ctx.strokeText(txt, 0, 0);
            ctx.fillText(txt, 0, 0);
        } else if (e.type === EntityType.EXPLOSION) {
            const prog = (e.duration || 0) / (e.maxDuration || 1);
            const r = Math.max(1, e.radius * (0.2 + Math.pow(prog, 0.5) * 0.8));
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
            grad.addColorStop(0, `rgba(255, 255, 255, ${1 - prog})`);
            grad.addColorStop(0.3, `rgba(255, 200, 50, ${(1 - prog) * 0.8})`);
            grad.addColorStop(0.7, `rgba(255, 50, 0, ${(1 - prog) * 0.4})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
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
    if (Math.abs(joystickDir.x) > 0.1 || Math.abs(joystickDir.y) > 0.1) {
        ctx.fillStyle = '#fff';
        const tLen = 15 + Math.random() * 15;
        ctx.fillRect(-10, 20, 5, tLen);
        ctx.fillRect(5, 20, 5, tLen);
    }

    ctx.fillStyle = isHitActive ? '#ffffff' : sColor;
    ctx.beginPath();
    ctx.moveTo(0, -30); ctx.lineTo(-25, 25); ctx.lineTo(0, 15); ctx.lineTo(25, 25);
    ctx.closePath(); ctx.fill();
    
    // Cockpit
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(0, -5, 8, 12, 0, 0, Math.PI*2); ctx.fill();

    ctx.restore();
};

export const renderGame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    enemies: Entity[],
    projectiles: Entity[],
    pickups: Entity[],
    particles: Entity[],
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
        const shakeAmount = hitIntensity * 20;
        ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
    }
    ctx.scale(GAME_ZOOM, GAME_ZOOM);
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
    renderProjectiles(ctx, projectiles, time);
    renderPlayer(ctx, playerPos, joystickDir, stats, time, lastPlayerHitTime);
    renderParticles(ctx, particles);

    ctx.restore();
};
