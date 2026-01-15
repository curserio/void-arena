/**
 * Core Entity Type Definitions
 * Base interfaces for all game entities
 */

export type Vector2D = { x: number; y: number };

// ============================================================================
// Base Entity Interfaces
// ============================================================================

/**
 * Minimal contract for all game entities
 */
export interface IEntity {
    readonly id: string;
    pos: Vector2D;
    vel: Vector2D;
    radius: number;
    isAlive: boolean;
}

/**
 * Entity that can take damage
 */
export interface IDamageable extends IEntity {
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    lastHitTime: number;
    lastShieldHitTime: number;
}

/**
 * Entity that can be rendered
 */
export interface IRenderable extends IEntity {
    color: string;
}

/**
 * Result of applying damage to an entity
 */
export interface DamageResult {
    actualDamage: number;
    shieldDamage: number;
    healthDamage: number;
    isKilled: boolean;
    overkill: number;
}

/**
 * Context passed to entity update methods
 */
export interface UpdateContext {
    dt: number;
    time: number;
    gameTime: number;
    playerPos: Vector2D;
}

/**
 * Result of enemy update - what should be spawned
 */
export interface EnemyUpdateResult {
    bulletsToSpawn: IProjectileSpawn[];
    enemiesToSpawn: IEnemySpawn[];
}

/**
 * Data needed to spawn a projectile
 */
export interface IProjectileSpawn {
    pos: Vector2D;
    vel: Vector2D;
    radius: number;
    color: string;
    isHoming?: boolean;
    turnRate?: number;
    maxDuration?: number;
    isElite?: boolean;
    level?: number;
}

/**
 * Data needed to spawn an enemy
 */
export interface IEnemySpawn {
    type: string;
    pos: Vector2D;
    vel?: Vector2D;
    tier?: string;
    difficultyMult?: number;
}
