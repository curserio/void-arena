/**
 * Rush Behavior
 * Inertial steering towards target (Kamikaze style)
 * Enemy gradually turns and accelerates towards target
 */

import { Vector2D } from '../../../../types';
import { AIContext } from '../AIContext';
import { IMovementBehavior } from './IMovementBehavior';

export interface RushConfig {
    turnRate: number;        // How fast to turn (higher = more agile)
    acceleration: number;    // Acceleration when aligned
    minSpeed: number;        // Minimum speed when turning
}

export class RushBehavior implements IMovementBehavior {
    private readonly config: RushConfig;

    constructor(config: Partial<RushConfig> = {}) {
        this.config = {
            turnRate: config.turnRate ?? 2.5,
            acceleration: config.acceleration ?? 250,
            minSpeed: config.minSpeed ?? 100,
        };
    }

    calculateVelocity(ctx: AIContext): Vector2D {
        const { enemy, playerPos, dt } = ctx;

        // Direction to player
        const dx = playerPos.x - enemy.pos.x;
        const dy = playerPos.y - enemy.pos.y;
        const distToPlayer = Math.hypot(dx, dy);

        if (distToPlayer < 1) {
            return enemy.vel;
        }

        const targetDirX = dx / distToPlayer;
        const targetDirY = dy / distToPlayer;

        // Current velocity info
        const currentSpeed = Math.hypot(enemy.vel.x, enemy.vel.y);

        let newDirX = targetDirX;
        let newDirY = targetDirY;

        // Inertial steering - gradually turn towards target
        if (currentSpeed > 50) {
            const normVelX = enemy.vel.x / currentSpeed;
            const normVelY = enemy.vel.y / currentSpeed;

            const turnAmount = this.config.turnRate * dt;
            newDirX = normVelX + (targetDirX - normVelX) * turnAmount;
            newDirY = normVelY + (targetDirY - normVelY) * turnAmount;

            // Normalize
            const len = Math.hypot(newDirX, newDirY);
            if (len > 0) {
                newDirX /= len;
                newDirY /= len;
            }
        }

        // Return direction - actual speed calculation handled by enemy
        // (Enemy multiplies by its calculated speed and applies tier modifiers)
        return { x: newDirX, y: newDirY };
    }

    /**
     * Calculate speed adjustment based on alignment with target
     */
    calculateSpeedMultiplier(ctx: AIContext): number {
        const { enemy, playerPos } = ctx;

        const dx = playerPos.x - enemy.pos.x;
        const dy = playerPos.y - enemy.pos.y;
        const distToPlayer = Math.hypot(dx, dy);

        if (distToPlayer < 1) return 1.0;

        const targetDirX = dx / distToPlayer;
        const targetDirY = dy / distToPlayer;

        const currentSpeed = Math.hypot(enemy.vel.x, enemy.vel.y);

        if (currentSpeed < 50) {
            return 1.0; // Initial full speed
        }

        // Calculate alignment (dot product with target direction)
        const normVelX = enemy.vel.x / currentSpeed;
        const normVelY = enemy.vel.y / currentSpeed;
        const alignment = normVelX * targetDirX + normVelY * targetDirY;

        if (alignment > 0.9) {
            return 1.0; // Accelerate when aligned
        } else {
            return 0.7; // Slow down when turning
        }
    }
}
