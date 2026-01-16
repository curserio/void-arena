/**
 * AI Context
 * Shared context passed to all AI behaviors
 */

import { Vector2D } from '../../../types';
import { BaseEnemy } from '../../entities/enemies/BaseEnemy';

export interface AIContext {
    // The enemy executing the behavior
    enemy: BaseEnemy;

    // Target position (usually player)
    playerPos: Vector2D;

    // Timing
    dt: number;
    time: number;
    gameTime: number;
}
