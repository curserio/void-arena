/**
 * Collision Helpers
 * Reusable collision detection functions
 */

import { Vector2D } from '../../../types';

/**
 * Check collision between two circular entities
 * Uses bounding box pre-check for optimization
 */
export function checkCircleCollision(
    a: { pos: Vector2D, radius: number },
    b: { pos: Vector2D, radius: number }
): boolean {
    // Bounding box pre-check (cheaper than sqrt)
    const radSum = a.radius + b.radius;
    if (Math.abs(a.pos.x - b.pos.x) > radSum) return false;
    if (Math.abs(a.pos.y - b.pos.y) > radSum) return false;

    // Precise circle check
    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    const distSq = dx * dx + dy * dy;
    return distSq < radSum * radSum;
}

/**
 * Calculate squared distance from point P to line segment VW
 * Used for laser beam collision detection
 */
export function distToSegmentSq(p: Vector2D, v: Vector2D, w: Vector2D): number {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;

    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    const distSq = (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
    return distSq;
}

/**
 * Calculate distance between two points
 */
export function distance(a: Vector2D, b: Vector2D): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}
