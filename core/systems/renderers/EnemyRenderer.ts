/**
 * EnemyRenderer
 * Renders all enemy types using the new EnemyType system
 * Extracted from GameRenderer.ts for separation of concerns
 */

import { Entity, Vector2D } from '../../../types';
import { EnemyType, EnemyTier, IEnemy } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';

// Helper to check if entity has new enemy type system
function isEnemy(e: Entity | IEnemy): e is IEnemy {
    return 'enemyType' in e && e.enemyType !== undefined;
}

// ============================================================================
// Helper: Asteroid Points Generation
// ============================================================================

function getAsteroidPoints(seed: number, radius: number): Vector2D[] {
    const seededRandom = (s: number): number => {
        const x = Math.sin(s * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    };

    const pts: Vector2D[] = [];
    const numPoints = 8;
    let s = seed;

    for (let i = 0; i < numPoints; i++) {
        const angle = (Math.PI * 2 / numPoints) * i;
        const r = radius * (0.7 + seededRandom(s) * 0.5);
        s += 1.618;
        pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return pts;
}

// ============================================================================
// Enemy Type Guard
// ============================================================================



// ============================================================================
// Renderer Type and Registry
// ============================================================================

/**
 * Standard render function signature for enemy body rendering
 */
type EnemyRenderFn = (
    ctx: CanvasRenderingContext2D,
    e: Entity | IEnemy,
    time: number,
    isRecentlyHit: boolean
) => void;

/**
 * Registry mapping EnemyType to render function
 * Adding a new enemy? Add its render function here.
 */
const ENEMY_RENDERERS: Partial<Record<EnemyType, EnemyRenderFn>> = {
    [EnemyType.BOSS_DESTROYER]: (ctx, e, _time, isRecentlyHit) => renderDestroyer(ctx, e, isRecentlyHit),
    [EnemyType.BOSS_DREADNOUGHT]: (ctx, e, _time, isRecentlyHit) => renderDreadnought(ctx, e, isRecentlyHit),
    [EnemyType.SCOUT]: (ctx, e) => renderScout(ctx, e),
    [EnemyType.STRIKER]: (ctx, e) => renderStriker(ctx, e),
    [EnemyType.LASER_SCOUT]: (ctx, e) => renderStriker(ctx, e), // Uses Striker shape
    [EnemyType.KAMIKAZE]: (ctx, e) => renderKamikaze(ctx, e),
    [EnemyType.SHIELDER]: (ctx, e, time) => renderShielder(ctx, e, time),
    [EnemyType.CARRIER]: (ctx, e) => renderCarrier(ctx, e),
};

// ============================================================================
// Main Render Function
// ============================================================================

export function renderEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: (Entity | IEnemy)[],
    time: number
): void {
    for (const e of enemies) {
        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);

        // Get enemy type - assume it's an enemy or asteroid
        // For Asteroids currently using IEnemy structure or plain Entity with type?
        // Actually Asteroid is IEnemy too now.
        if (!isEnemy(e) && e.type !== 'ASTEROID') {
            // Skip non-enemies (e.g. bullets if passed here by mistake)
            if (e.type === 'ENEMY_BULLET') {
                // Enemy bullets rendered in renderProjectiles usually?
                // If passed here, ignore or render?
                // renderEnemies usually only receives enemiesRef.
            }
            // Support legacy Asteroid if it's an Entity with type specific?
            // But we migrated Asteroid to IEnemy.
        }

        const enemyType = isEnemy(e) ? e.enemyType : EnemyType.ASTEROID; // Fallback
        const tier = isEnemy(e) ? e.tier : EnemyTier.NORMAL;

        // =========================================
        // ASTEROID
        // =========================================
        if (enemyType === EnemyType.ASTEROID) {
            renderAsteroid(ctx, e, time);
            ctx.restore();
            continue;
        }

        // =========================================
        // OTHER ENEMIES
        // =========================================
        const hitAge = time - (e.lastHitTime || 0);
        const isRecentlyHit = hitAge < 80;
        const isShieldHit = (time - (e.lastShieldHitTime || 0)) < 120;
        const isElite = tier === EnemyTier.ELITE;
        const isLegendary = tier === EnemyTier.LEGENDARY;
        const isMiniboss = tier === EnemyTier.MINIBOSS;
        const isBoss = enemyType === EnemyType.BOSS_DREADNOUGHT || enemyType === EnemyType.BOSS_DESTROYER;

        // Health Bars & Labels
        renderEnemyHUD(ctx, e, enemyType, tier, isBoss);

        // Laser Beam (LaserScout & Dreadnought)
        if ((enemyType === EnemyType.LASER_SCOUT || enemyType === EnemyType.BOSS_DREADNOUGHT) &&
            (e.isFiring || e.isCharging)) {
            renderLaserBeam(ctx, e, isBoss, tier);
        }

        // Body Rotation
        if ((enemyType === EnemyType.LASER_SCOUT || enemyType === EnemyType.BOSS_DREADNOUGHT) &&
            (e.isCharging || e.isFiring)) {
            ctx.rotate((e.angle || 0) + Math.PI / 2);
        } else {
            ctx.rotate(Math.atan2(e.vel.y, e.vel.x) + Math.PI / 2);
        }

        // Shadow/Glow based on tier
        ctx.shadowBlur = isBoss ? 50 : (isMiniboss ? 35 : (isLegendary ? 30 : (isElite ? 25 : 15)));
        ctx.shadowColor = e.color;

        // Fill color based on hit state
        if (isShieldHit) ctx.fillStyle = '#ffffff';
        else if (isRecentlyHit) ctx.fillStyle = '#ff0000';
        else ctx.fillStyle = e.color;

        // Render body using registry
        const renderer = ENEMY_RENDERERS[enemyType];
        if (renderer) {
            renderer(ctx, e, time, isRecentlyHit);
        } else {
            // Default fallback to Striker shape
            renderStriker(ctx, e);
        }

        // Shield Aura
        if (e.shield !== undefined && e.shield > 0) {
            renderShieldAura(ctx, e, isShieldHit);
        }

        ctx.restore();
    }
}

// ============================================================================
// Sub-Renderers
// ============================================================================

function renderAsteroid(ctx: CanvasRenderingContext2D, e: Entity | IEnemy, time: number): void {
    const isRecentlyHit = (time - (e.lastHitTime || 0)) < 80;
    const seed = 'seed' in e ? (e.seed || 0) : 0;
    const pts = getAsteroidPoints(seed as number, e.radius);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();

    const grad = ctx.createRadialGradient(-e.radius * 0.3, -e.radius * 0.3, 0.1, 0, 0, Math.max(0.1, e.radius));
    grad.addColorStop(0, isRecentlyHit ? '#ffffff' : '#64748b');
    grad.addColorStop(1, isRecentlyHit ? '#ffffff' : '#1e293b');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = isRecentlyHit ? '#ffffff' : '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texture detail
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x * 0.4, pts[0].y * 0.4);
    ctx.lineTo(pts[4].x * 0.6, pts[4].y * 0.6);
    ctx.stroke();
}

function renderEnemyHUD(
    ctx: CanvasRenderingContext2D,
    e: Entity | IEnemy,
    enemyType: EnemyType,
    tier: EnemyTier,
    isBoss: boolean
): void {
    ctx.save();
    const hudY = -e.radius - 20;

    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';

    // Labels based on type/tier
    if (enemyType === EnemyType.BOSS_DESTROYER) {
        ctx.shadowBlur = 25;
        // Boss tier color overrides
        const tierColor = tier === EnemyTier.LEGENDARY ? '#fbbf24' : (tier === EnemyTier.ELITE ? '#d946ef' : '#f97316');
        ctx.shadowColor = tierColor;
        ctx.fillStyle = tierColor;
        ctx.font = '900 16px Arial';
        const tierLabel = tier === EnemyTier.LEGENDARY ? '★ LEGENDARY ' : (tier === EnemyTier.ELITE ? '◆ ELITE ' : '');
        ctx.fillText(tierLabel + "IMPERIAL DESTROYER", 0, hudY - 25);
    } else if (enemyType === EnemyType.BOSS_DREADNOUGHT) {
        ctx.shadowBlur = 25;
        const tierColor = tier === EnemyTier.LEGENDARY ? '#fbbf24' : (tier === EnemyTier.ELITE ? '#d946ef' : '#4ade80');
        ctx.shadowColor = tierColor;
        ctx.fillStyle = tierColor;
        ctx.font = '900 16px Arial';
        const tierLabel = tier === EnemyTier.LEGENDARY ? '★ LEGENDARY ' : (tier === EnemyTier.ELITE ? '◆ ELITE ' : '');
        ctx.fillText(tierLabel + "GALACTIC DREADNOUGHT", 0, hudY - 25);
    } else if (tier === EnemyTier.MINIBOSS) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 12px Arial';
        ctx.fillText("MINIBOSS", 0, hudY - 20);
    } else if (tier === EnemyTier.LEGENDARY) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fbbf24';
        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 12px Arial';
        ctx.fillText("★ LEGENDARY", 0, hudY - 20);
    } else if (tier === EnemyTier.ELITE) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#d946ef';
        ctx.fillStyle = '#d946ef';
        const hasDeathDefiance = 'hasDeathDefiance' in e && e.hasDeathDefiance;
        ctx.fillText(hasDeathDefiance ? "ELITE [ARMORED]" : "ELITE", 0, hudY - 20);
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`LV ${e.level || 1}`, 0, hudY - 10);
    }

    // Health bar
    const barW = Math.max(40, e.radius * 2);
    const barH = 4;
    const barX = -barW / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX, hudY - 5, barW, barH);

    const hpRatio = Math.max(0, e.health / e.maxHealth);
    ctx.fillStyle = hpRatio < 0.3 ? '#f87171' : (isBoss ? '#4ade80' : '#ef4444');
    ctx.fillRect(barX, hudY - 5, barW * hpRatio, barH);

    // Shield bar
    if (e.maxShield && e.maxShield > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(barX, hudY, barW, barH);
        const shRatio = Math.max(0, (e.shield || 0) / e.maxShield);
        ctx.fillStyle = '#06fdfd';
        ctx.fillRect(barX, hudY, barW * shRatio, barH);
    }

    ctx.restore();
}

function renderLaserBeam(ctx: CanvasRenderingContext2D, e: Entity | IEnemy, isBoss: boolean, tier: EnemyTier = EnemyTier.NORMAL): void {
    ctx.save();
    ctx.rotate(e.angle || 0);

    // Tier-based beam colors
    let beamColor = isBoss ? '74, 222, 128' : '255, 0, 0';
    let beamHex = isBoss ? '#4ade80' : '#ff0000';

    if (tier === EnemyTier.LEGENDARY) {
        beamColor = '251, 191, 36'; // Gold
        beamHex = '#fbbf24';
    } else if (tier === EnemyTier.ELITE) {
        beamColor = '217, 70, 239'; // Magenta
        beamHex = '#d946ef';
    } else if (tier === EnemyTier.MINIBOSS) {
        beamColor = '239, 68, 68'; // Red
        beamHex = '#ef4444';
    }

    const beamLen = isBoss ? 1600 : 1200;
    const beamScale = isBoss ? 2.5 : (tier === EnemyTier.MINIBOSS ? 1.8 : (tier === EnemyTier.LEGENDARY ? 1.5 : (tier === EnemyTier.ELITE ? 1.3 : 1.0)));

    if (e.isCharging) {
        const prog = e.chargeProgress || 0;
        ctx.strokeStyle = `rgba(${beamColor}, ${0.1 + prog * 0.6})`;
        ctx.lineWidth = (1 + prog * 3) * beamScale;
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(beamLen, 0);
        ctx.stroke();
    }

    if (e.isFiring) {
        const prog = e.chargeProgress || 0;
        const width = 30 * (1 - prog) * beamScale;

        ctx.shadowBlur = 50;
        ctx.shadowColor = beamHex;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -width / 2, beamLen, width);
        ctx.fillStyle = `rgba(${beamColor}, 0.4)`;
        ctx.fillRect(0, -width, beamLen, width * 2);
    }

    ctx.restore();
}

function renderDestroyer(ctx: CanvasRenderingContext2D, e: Entity | IEnemy, isRecentlyHit: boolean): void {
    const w = e.radius * 0.8;
    const h = e.radius * 1.8;

    // Hull
    ctx.beginPath();
    ctx.moveTo(0, -h); // Nose
    ctx.lineTo(w, h * 0.6); // Bottom Right
    ctx.lineTo(0, h * 0.4); // Rear Notch center
    ctx.lineTo(-w, h * 0.6); // Bottom Left
    ctx.closePath();
    ctx.fill();

    // Bridge Tower
    ctx.fillStyle = isRecentlyHit ? '#ffaaaa' : '#475569';
    ctx.beginPath();
    ctx.rect(-w * 0.3, 0, w * 0.6, h * 0.3);
    ctx.fill();

    // Engine Glows
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(-w * 0.5, h * 0.6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Weapon Hardpoints
    ctx.fillStyle = '#fff';
    ctx.fillRect(-w - 2, 0, 4, 15);
    ctx.fillRect(w - 2, 0, 4, 15);
}

function renderDreadnought(ctx: CanvasRenderingContext2D, e: Entity | IEnemy, isRecentlyHit: boolean): void {
    // Main Body
    const grad = ctx.createRadialGradient(-15, -15, 5, 0, 0, e.radius);
    grad.addColorStop(0, '#52525b');
    grad.addColorStop(1, '#18181b');
    ctx.fillStyle = isRecentlyHit ? '#ff0000' : grad;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();

    // Equatorial Trench
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-e.radius, 0);
    ctx.lineTo(e.radius, 0);
    ctx.stroke();

    // Superlaser Dish
    const dishY = -e.radius * 0.5;
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(0, dishY, e.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glow if charging
    if (e.isCharging || e.isFiring) {
        const prog = e.chargeProgress || 0;
        ctx.fillStyle = `rgba(16, 185, 129, ${prog})`;
        ctx.beginPath();
        ctx.arc(0, dishY, e.radius * 0.15 * prog, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderScout(ctx: CanvasRenderingContext2D, e: Entity | IEnemy): void {
    ctx.beginPath();
    ctx.moveTo(0, -e.radius);
    ctx.lineTo(-e.radius * 0.8, e.radius * 0.5);
    ctx.lineTo(-e.radius * 0.3, e.radius * 0.3);
    ctx.lineTo(0, e.radius * 0.8);
    ctx.lineTo(e.radius * 0.3, e.radius * 0.3);
    ctx.lineTo(e.radius * 0.8, e.radius * 0.5);
    ctx.closePath();
    ctx.fill();
}

function renderKamikaze(ctx: CanvasRenderingContext2D, e: Entity | IEnemy): void {
    ctx.beginPath();
    ctx.moveTo(0, -e.radius * 1.5); // Long nose
    ctx.lineTo(-e.radius, e.radius);
    ctx.lineTo(0, e.radius * 0.5); // Indent
    ctx.lineTo(e.radius, e.radius);
    ctx.closePath();
    ctx.fill();

    // Engine Glow
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, e.radius * 0.8, e.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Shielder - Support unit with protective aura
 */
function renderShielder(ctx: CanvasRenderingContext2D, e: Entity | IEnemy, time: number): void {
    const pulse = 0.7 + Math.sin(time * 0.003) * 0.3;
    const AURA_RADIUS = 150; // Match SHIELD_AURA_RADIUS constant

    // Draw protective aura bubble first (behind shielder)
    ctx.save();
    ctx.globalAlpha = 0.15 * pulse;
    const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, AURA_RADIUS);
    auraGrad.addColorStop(0, 'rgba(34, 211, 238, 0.4)');
    auraGrad.addColorStop(0.7, 'rgba(34, 211, 238, 0.2)');
    auraGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, AURA_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Aura ring
    ctx.globalAlpha = 0.3 * pulse;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, AURA_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Draw shielder body - hexagonal shape
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI / 3) - Math.PI / 2;
        const x = Math.cos(angle) * e.radius;
        const y = Math.sin(angle) * e.radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Inner glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Rotating energy ring
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.rotate(time * 0.002);
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.7, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
}

// Carrier - Larger hexagonal spawner with bay door visual
function renderCarrier(ctx: CanvasRenderingContext2D, e: Entity | IEnemy): void {
    const r = e.radius;

    // Hexagonal main body
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Inner bay (darker hexagon)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = Math.cos(angle) * r * 0.5;
        const y = Math.sin(angle) * r * 0.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

function renderStriker(ctx: CanvasRenderingContext2D, e: Entity | IEnemy): void {
    ctx.beginPath();
    ctx.moveTo(0, -e.radius);
    ctx.lineTo(-e.radius, 0);
    ctx.lineTo(-e.radius * 0.8, e.radius);
    ctx.lineTo(0, e.radius * 0.4);
    ctx.lineTo(e.radius * 0.8, e.radius);
    ctx.lineTo(e.radius, 0);
    ctx.closePath();
    ctx.fill();
}

function renderShieldAura(ctx: CanvasRenderingContext2D, e: Entity | IEnemy, isShieldHit: boolean): void {
    const shRad = e.radius * 1.3;
    ctx.shadowBlur = isShieldHit ? 30 : 15;
    ctx.shadowColor = isShieldHit ? '#fff' : '#06fdfd';
    ctx.strokeStyle = isShieldHit ? '#fff' : 'rgba(6, 253, 253, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, shRad, 0, Math.PI * 2);
    ctx.stroke();
}



// ============================================================================
// Export for use in GameRenderer
// ============================================================================

export { getAsteroidPoints };
