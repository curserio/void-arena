/**
 * Chase Behavior
 * Direct pursuit of the target with optional pulsing speed
 * Used by: Striker
 */

import { Vector2D } from '../../../../types';
import { AIContext } from '../AIContext';
import { IMovementBehavior } from './IMovementBehavior';

export interface ChaseConfig {
    pulseEnabled: boolean;   // Enable speed pulsing
    pulseAmount: number;     // Pulse amplitude (0.0-1.0)
    pulseSpeed: number;      // Pulse frequency
}

export class ChaseBehavior implements IMovementBehavior {
    private readonly config: ChaseConfig;

    constructor(config: Partial<ChaseConfig> = {}) {
        this.config = {
            pulseEnabled: config.pulseEnabled ?? true,
            pulseAmount: config.pulseAmount ?? 0.2,
            pulseSpeed: config.pulseSpeed ?? 0.005,
        };
    }

    calculateVelocity(ctx: AIContext): Vector2D {
        const { enemy, playerPos, time } = ctx;

        // Direction to player
        const dx = playerPos.x - enemy.pos.x;
        const dy = playerPos.y - enemy.pos.y;
        const distToPlayer = Math.hypot(dx, dy);

        if (distToPlayer < 1) {
            return { x: 0, y: 0 };
        }

        // Normalized direction
        let dirX = dx / distToPlayer;
        let dirY = dy / distToPlayer;

        // Apply pulse multiplier
        let speedMult = 1.0;
        if (this.config.pulseEnabled) {
            speedMult = 1.0 + Math.sin(time * this.config.pulseSpeed + enemy.aiPhase) * this.config.pulseAmount;
        }

        return {
            x: dirX * speedMult,
            y: dirY * speedMult,
        };
    }
}
