/**
 * Damage Aggregator
 * Combines rapid damage hits in proximity into single damage numbers
 * Reduces particle spam while making damage feel more impactful
 */

import { Vector2D } from '../../../types';

interface PendingDamage {
    pos: Vector2D;
    totalDamage: number;
    color: string;
    hitCount: number;
}

export interface AggregatedDamage {
    pos: Vector2D;
    damage: number;
    color: string;
}

export class DamageAggregator {
    private pending: Map<string, PendingDamage> = new Map();
    private readonly cellSize: number;

    constructor(cellSize: number = 60) {
        this.cellSize = cellSize;
    }

    /**
     * Get spatial key for position
     */
    private getKey(pos: Vector2D): string {
        const cx = Math.floor(pos.x / this.cellSize);
        const cy = Math.floor(pos.y / this.cellSize);
        return `${cx},${cy}`;
    }

    /**
     * Add damage to be aggregated
     */
    add(pos: Vector2D, damage: number, color: string): void {
        if (damage <= 0) return;

        const key = this.getKey(pos);
        const existing = this.pending.get(key);

        if (existing) {
            // Aggregate with existing damage
            existing.totalDamage += damage;
            existing.hitCount++;
            // Keep color of highest damage (usually critical hits are different color)
            // Or blend towards the new color weighted by damage
        } else {
            // New damage cluster
            this.pending.set(key, {
                pos: { x: pos.x, y: pos.y },
                totalDamage: damage,
                color,
                hitCount: 1,
            });
        }
    }

    /**
     * Flush all pending damage - call once per frame
     * Returns aggregated damage entries to spawn
     */
    flush(): AggregatedDamage[] {
        const result: AggregatedDamage[] = [];

        for (const entry of this.pending.values()) {
            result.push({
                pos: entry.pos,
                damage: entry.totalDamage,
                color: entry.color,
            });
        }

        this.pending.clear();
        return result;
    }

    /**
     * Check if there's pending damage
     */
    hasPending(): boolean {
        return this.pending.size > 0;
    }
}

// Singleton instance
export const damageAggregator = new DamageAggregator();
