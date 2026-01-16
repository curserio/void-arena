/**
 * Explosion Batcher
 * Merges nearby explosions into larger combined explosions
 * Reduces particle count while making destruction feel more epic
 */

import { Vector2D } from '../../../types';

interface PendingExplosion {
    pos: Vector2D;
    totalRadius: number;
    count: number;
    color: string;
}

export interface MergedExplosion {
    pos: Vector2D;
    radius: number;
    color: string;
}

export class ExplosionBatcher {
    private pending: PendingExplosion[] = [];
    private readonly mergeDistance: number;

    constructor(mergeDistance: number = 80) {
        this.mergeDistance = mergeDistance;
    }

    /**
     * Add explosion to be batched
     */
    add(pos: Vector2D, radius: number, color: string): void {
        // Try to merge with existing nearby explosion
        for (const existing of this.pending) {
            const dx = pos.x - existing.pos.x;
            const dy = pos.y - existing.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.mergeDistance) {
                // Merge: average position, combine radius (with diminishing returns)
                const weight = existing.count / (existing.count + 1);
                existing.pos.x = existing.pos.x * weight + pos.x * (1 - weight);
                existing.pos.y = existing.pos.y * weight + pos.y * (1 - weight);
                // Radius grows but with diminishing returns (sqrt scaling)
                existing.totalRadius = Math.sqrt(existing.totalRadius ** 2 + radius ** 2);
                existing.count++;
                return;
            }
        }

        // No nearby explosion to merge with
        this.pending.push({
            pos: { x: pos.x, y: pos.y },
            totalRadius: radius,
            count: 1,
            color,
        });
    }

    /**
     * Flush all pending explosions - call once per frame
     */
    flush(): MergedExplosion[] {
        const result: MergedExplosion[] = [];

        for (const entry of this.pending) {
            result.push({
                pos: entry.pos,
                radius: entry.totalRadius,
                color: entry.color,
            });
        }

        this.pending.length = 0;
        return result;
    }

    /**
     * Check if there's pending explosions
     */
    hasPending(): boolean {
        return this.pending.length > 0;
    }
}

// Singleton instance
export const explosionBatcher = new ExplosionBatcher();
