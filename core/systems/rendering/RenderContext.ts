/**
 * Render Context
 * Shared state passed to all renderers
 */

import { Entity, PlayerStats, Vector2D, GameState } from '../../../types';
import { IEnemy } from '../../../types/enemies';
import { BaseProjectile } from '../../entities/projectiles/BaseProjectile';

export interface RenderContext {
    // Canvas
    ctx: CanvasRenderingContext2D;

    // Timing
    time: number;

    // Player state
    playerPos: Vector2D;
    playerStats: PlayerStats;
    joystickDir: Vector2D;
    aimDir: Vector2D;
    lastPlayerHitTime: number;
    gameState: GameState;

    // Entities
    enemies: (Entity | IEnemy)[];
    projectiles: BaseProjectile[];
    pickups: Entity[];
    particles: Entity[];
}
