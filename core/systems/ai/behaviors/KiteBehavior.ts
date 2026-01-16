/**
 * Kite Behavior
 * Maintains optimal range from target with orbital strafing
 * Used by: LaserScout
 */

import { Vector2D } from '../../../../types';
import { AIContext } from '../AIContext';
import { IMovementBehavior } from './IMovementBehavior';

export interface KiteConfig {
    optimalRange: number;    // Preferred distance to target
    retreatSpeed: number;    // Speed multiplier when too close
    strafeAmount: number;    // Orbital strafing strength
}

export class KiteBehavior implements IMovementBehavior {
    private readonly config: KiteConfig;

    constructor(config: Partial<KiteConfig> = {}) {
        this.config = {
            optimalRange: config.optimalRange ?? 600,
            retreatSpeed: config.retreatSpeed ?? 1.2,
            strafeAmount: config.strafeAmount ?? 0.8,
        };
    }

    calculateVelocity(ctx: AIContext): Vector2D {
        const { enemy, playerPos } = ctx;

        // Direction to player
        const dx = playerPos.x - enemy.pos.x;
        const dy = playerPos.y - enemy.pos.y;
        const distToPlayer = Math.hypot(dx, dy);

        if (distToPlayer < 1) {
            return { x: 0, y: 0 };
        }

        const orbitDir = enemy.aiSeed > 0.5 ? 1 : -1;

        let moveX = 0;
        let moveY = 0;

        if (distToPlayer > this.config.optimalRange) {
            // Approach
            moveX = dx / distToPlayer;
            moveY = dy / distToPlayer;
        } else {
            // Retreat
            moveX = (-dx / distToPlayer) * this.config.retreatSpeed;
            moveY = (-dy / distToPlayer) * this.config.retreatSpeed;
        }

        // Add orbital strafing (perpendicular to player direction)
        moveX += (-dy / distToPlayer) * this.config.strafeAmount * orbitDir;
        moveY += (dx / distToPlayer) * this.config.strafeAmount * orbitDir;

        // Normalize
        const len = Math.hypot(moveX, moveY);
        if (len > 0) {
            moveX /= len;
            moveY /= len;
        }

        return { x: moveX, y: moveY };
    }
}
