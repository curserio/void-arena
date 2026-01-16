/**
 * Game Renderer
 * Simplified main render function using RenderManager
 */

import { Entity, PlayerStats, Vector2D, GameState } from '../../types';
import { WORLD_SIZE } from '../../constants';
import { BaseProjectile } from '../entities/projectiles/BaseProjectile';
import { IEnemy } from '../../types/enemies';
import { renderManager, RenderContext } from './rendering';

/**
 * Main game render function
 */
export const renderGame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    enemies: (Entity | IEnemy)[],
    projectiles: BaseProjectile[],
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

    // Screen shake on death or hit
    if (gameState === GameState.DYING) {
        const shake = 15;
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    } else if (isHitActive) {
        const shakeAmount = hitIntensity * 20;
        ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
    }

    // Dynamic zoom (zoom out during Afterburner boost only)
    const afterburnerSlot = stats.moduleSlots.find(s => s.type === 'AFTERBURNER');
    const isAfterburnerActive = afterburnerSlot && time < afterburnerSlot.activeUntil;
    const boostZoom = isAfterburnerActive ? 0.9 : 1.0;
    ctx.scale(zoomLevel * boostZoom, zoomLevel * boostZoom);

    ctx.translate(-cameraPos.x, -cameraPos.y);

    // Render boundary
    renderBoundary(ctx);

    // Build render context
    const rCtx: RenderContext = {
        ctx,
        time,
        cameraPos,
        screenWidth: canvas.width,
        screenHeight: canvas.height,
        zoom: zoomLevel * boostZoom,
        playerPos,
        playerStats: stats,
        joystickDir,
        aimDir,
        lastPlayerHitTime,
        gameState,
        enemies,
        projectiles,
        pickups,
        particles,
    };

    // Render all layers via manager
    renderManager.renderAll(rCtx);

    ctx.restore();
};

/**
 * Render world boundary
 */
function renderBoundary(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Dashed neon wall
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 8;
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#06b6d4';
    ctx.setLineDash([40, 20]); // Dashed pattern
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Internal glow (solid, subtle)
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.strokeRect(-15, -15, WORLD_SIZE + 30, WORLD_SIZE + 30);

    ctx.restore();
}
