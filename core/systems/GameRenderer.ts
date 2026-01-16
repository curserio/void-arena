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

    // Dynamic zoom (zoom out during boost)
    const boostZoom = (time < stats.moduleActiveUntil) ? 0.9 : 1.0;
    ctx.scale(zoomLevel * boostZoom, zoomLevel * boostZoom);

    ctx.translate(-cameraPos.x, -cameraPos.y);

    // Render boundary
    renderBoundary(ctx);

    // Build render context
    const rCtx: RenderContext = {
        ctx,
        time,
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
    // Neon wall
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 12;
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#06b6d4';
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Internal glow
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -20, WORLD_SIZE + 40, WORLD_SIZE + 40);
}
