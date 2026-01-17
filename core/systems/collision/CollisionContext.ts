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
    spawnLightning: (start: Vector2D, end: Vector2D, color: string) => void;
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
 * Helper to apply damage to an enemy using takeDamage() for proper damage reduction
 */
export function applyDamageToEnemy(
    e: IEnemy,
    dmg: number,
    isCrit: boolean,
    ctx: CollisionContext,
    explosionColor?: string
): void {
    const { time, callbacks } = ctx;

    // Death Defiance check first (Elite Kamikaze survives one lethal hit)
    if (dmg >= e.health && e.hasDeathDefiance) {
        e.hasDeathDefiance = false;
        e.shield = 0;
        callbacks.spawnDamageText(e.pos, 0, '#ffffff');
        callbacks.spawnExplosion(e.pos, e.radius * 1.5, '#f0f');
        return;
    }

    // Use enemy's takeDamage() method - handles isShielded damage reduction
    const damageResult = e.takeDamage(dmg, time);

    // Record damage for DPS meter (lazy import to avoid circular deps)
    import('../../../components/DpsMeter').then(m => m.recordDamage(damageResult.actualDamage));

    // Display actual damage dealt (after reduction if shielded)
    const textColor = explosionColor || (isCrit ? '#facc15' : (e.isShielded ? '#67e8f9' : '#fff'));
    callbacks.spawnDamageText(e.pos, damageResult.actualDamage, textColor);
}
