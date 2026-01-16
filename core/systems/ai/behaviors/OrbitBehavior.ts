/**
 * Orbit Behavior
 * Movement pattern that orbits around the target at a specified radius
 * Used by: Scout, LaserScout
 */

import { Vector2D } from '../../../../types';
import { AIContext } from '../AIContext';
import { IMovementBehavior } from './IMovementBehavior';

export interface OrbitConfig {
    baseRadius: number;      // Base orbit radius
    radiusVariance: number;  // Random variance per enemy
    orbitSpeed: number;      // Angular velocity multiplier
}

export class OrbitBehavior implements IMovementBehavior {
    private readonly config: OrbitConfig;

    constructor(config: Partial<OrbitConfig> = {}) {
        this.config = {
            baseRadius: config.baseRadius ?? 320,
            radiusVariance: config.radiusVariance ?? 100,
            orbitSpeed: config.orbitSpeed ?? 0.0003,
        };
    }

    calculateVelocity(ctx: AIContext): Vector2D {
        const { enemy, playerPos, time } = ctx;

        // Calculate orbit parameters using enemy's AI seed for variance
        const orbitRadius = this.config.baseRadius + enemy.aiSeed * this.config.radiusVariance;
        const idealAngle = enemy.aiSeed * Math.PI * 2 + (time * this.config.orbitSpeed);

        // Target position on orbit
        const targetX = playerPos.x + Math.cos(idealAngle) * orbitRadius;
        const targetY = playerPos.y + Math.sin(idealAngle) * orbitRadius;

        // Direction to target
        const toTargetX = targetX - enemy.pos.x;
        const toTargetY = targetY - enemy.pos.y;
        const distToTarget = Math.hypot(toTargetX, toTargetY);

        if (distToTarget < 1) {
            return { x: 0, y: 0 };
        }

        // Return normalized direction (speed applied by enemy)
        return {
            x: toTargetX / distToTarget,
            y: toTargetY / distToTarget,
        };
    }
}
