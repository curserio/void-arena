/**
 * Shielding Behavior
 * Movement pattern that stays near other enemies to protect them
 * Used by: Shielder
 */

import { Vector2D } from '../../../../types';
import { AIContext } from '../AIContext';
import { IMovementBehavior } from './IMovementBehavior';

export interface ShieldingConfig {
    preferredDistance: number;   // Distance to maintain from allies
    searchRadius: number;        // Radius to search for allies
    playerAvoidance: number;     // How much to avoid player
}

export class ShieldingBehavior implements IMovementBehavior {
    private readonly config: ShieldingConfig;

    constructor(config: Partial<ShieldingConfig> = {}) {
        this.config = {
            preferredDistance: config.preferredDistance ?? 80,
            searchRadius: config.searchRadius ?? 300,
            playerAvoidance: config.playerAvoidance ?? 250,
        };
    }

    calculateVelocity(ctx: AIContext): Vector2D {
        const { enemy, playerPos, enemies } = ctx;

        // Find nearest non-shielder ally to protect
        let nearestAlly: { pos: Vector2D; dist: number } | null = null;

        if (enemies) {
            for (const other of enemies) {
                if (other.id === enemy.id) continue;
                if (other.enemyType === 'SHIELDER') continue; // Don't protect other shielders
                if (!other.isAlive) continue;

                const dx = other.pos.x - enemy.pos.x;
                const dy = other.pos.y - enemy.pos.y;
                const dist = Math.hypot(dx, dy);

                if (dist < this.config.searchRadius) {
                    if (!nearestAlly || dist < nearestAlly.dist) {
                        nearestAlly = { pos: other.pos, dist };
                    }
                }
            }
        }

        let targetX: number, targetY: number;

        if (nearestAlly) {
            // Move toward ally, maintaining protective distance
            const toAllyX = nearestAlly.pos.x - enemy.pos.x;
            const toAllyY = nearestAlly.pos.y - enemy.pos.y;

            if (nearestAlly.dist > this.config.preferredDistance) {
                // Move closer to ally
                targetX = toAllyX;
                targetY = toAllyY;
            } else {
                // Orbit around ally slightly
                const angle = Math.atan2(toAllyY, toAllyX) + 0.3;
                targetX = Math.cos(angle) * 20;
                targetY = Math.sin(angle) * 20;
            }
        } else {
            // No allies nearby - drift toward player but stay at distance
            const toPlayerX = playerPos.x - enemy.pos.x;
            const toPlayerY = playerPos.y - enemy.pos.y;
            const distToPlayer = Math.hypot(toPlayerX, toPlayerY);

            if (distToPlayer > this.config.playerAvoidance) {
                targetX = toPlayerX;
                targetY = toPlayerY;
            } else {
                // Too close to player, back away slightly
                targetX = -toPlayerX * 0.3;
                targetY = -toPlayerY * 0.3;
            }
        }

        // Normalize
        const dist = Math.hypot(targetX, targetY);
        if (dist < 1) return { x: 0, y: 0 };

        return {
            x: targetX / dist,
            y: targetY / dist,
        };
    }
}
