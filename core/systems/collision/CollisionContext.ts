/**
 * Collision Context
 * Shared context passed to all collision handlers
 */

import { Entity, Vector2D, PlayerStats, PersistentData } from '../../../types';
import { IEnemy } from '../../../types/enemies';
import { IProjectile } from '../../../types/projectiles';
import { SpatialHashGrid } from '../../utils/SpatialHashGrid';

export interface CollisionCallbacks {
    onEnemyHit: () => void;
    onEnemyKilled: () => void;
    onCreditCollected: (amount: number) => void;
    triggerPlayerHit: (time: number, damage: number, source: Entity | string) => void;
    spawnDamageText: (pos: Vector2D, damage: number, color: string) => void;
    spawnExplosion: (pos: Vector2D, radius: number, color: string) => void;
    setStats: (fn: (prev: PlayerStats) => PlayerStats) => void;
    setScore: (fn: (prev: number) => number) => void;
}

export interface CollisionContext {
    // Timing
    time: number;
    dt: number;

    // Entities
    playerPos: Vector2D;
    playerStats: PlayerStats;
    enemies: IEnemy[];
    projectiles: IProjectile[];
    pickups: Entity[];

    // Spatial partitioning
    grid: SpatialHashGrid<IEnemy>;

    // Persistent data (for meta upgrades)
    persistentData: PersistentData;

    // Callbacks
    callbacks: CollisionCallbacks;
}

/**
 * Helper to apply damage to an enemy with shield logic
 */
export function applyDamageToEnemy(
    e: IEnemy,
    dmg: number,
    isCrit: boolean,
    ctx: CollisionContext,
    explosionColor?: string
): void {
    const { time, callbacks } = ctx;
    let hullDmg = dmg;

    // Shield Logic
    if (e.shield && e.shield > 0) {
        e.lastShieldHitTime = time;
        if (e.shield >= dmg) {
            e.shield -= dmg;
            hullDmg = 0;
        } else {
            hullDmg -= e.shield;
            e.shield = 0;
        }
    }

    // Death Defiance (Elite Kamikaze)
    if (hullDmg >= e.health && e.hasDeathDefiance) {
        hullDmg = 0;
        e.shield = 0;
        e.hasDeathDefiance = false;
        callbacks.spawnDamageText(e.pos, 0, '#ffffff');
        callbacks.spawnExplosion(e.pos, e.radius * 1.5, '#f0f');
    }

    if (hullDmg > 0) e.health -= hullDmg;
    e.lastHitTime = time;

    const textColor = explosionColor || (isCrit ? '#facc15' : '#fff');
    callbacks.spawnDamageText(e.pos, dmg, textColor);
}
