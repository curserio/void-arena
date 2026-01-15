/**
 * Core Entity Type Definitions
 * Base interfaces for all game entities
 */

import { WeaponType, PowerUpId, ModuleType } from './player';
import { ShipType } from './ships';

export enum EntityType {
    PLAYER = 'PLAYER',
    ASTEROID = 'ASTEROID',
    BULLET = 'BULLET', // Legacy, prefer specifics
    PLAYER_BULLET = 'PLAYER_BULLET', // Added for ProjectileType alignment
    ENEMY_BULLET = 'ENEMY_BULLET',
    XP_GEM = 'XP_GEM',
    POWERUP = 'POWERUP',
    CREDIT = 'CREDIT',
    EXPLOSION = 'EXPLOSION',
    DAMAGE_NUMBER = 'DAMAGE_NUMBER',
    SPAWN_FLASH = 'SPAWN_FLASH'
}

export type Vector2D = { x: number; y: number };

// ============================================================================
// Base Entity Interfaces
// ============================================================================

/**
 * Minimal contract for all game entities
 */
export interface IEntity {
    readonly id: string;
    type: EntityType; // Added type to base
    pos: Vector2D;
    vel: Vector2D;
    radius: number;
    isAlive: boolean;

    // Legacy/Shared Optional Fields (for compatibility during refactor)
    rotation?: number;
    color: string; // Required for IRenderable compatibility
    level?: number;
    isElite?: boolean;
    isLegendary?: boolean;
    isMiniboss?: boolean;
    isBoss?: boolean;

    // Legacy Fields (Consider moving to specific interfaces later)
    health?: number;
    maxHealth?: number;
    damage?: number;  // Enemy projectile damage
    isCharging?: boolean;
    isFiring?: boolean;
    chargeProgress?: number;
    duration?: number;
    maxDuration?: number;
    value?: number;
    powerUpId?: string; // Legacy

    // More Legacy / Enemy Fields
    angle?: number;
    shield?: number;
    maxShield?: number;
    lastHitTime?: number;
    lastShieldHitTime?: number;
}

export type Entity = IEntity;

/**
 * Entity that can take damage
 */
export interface IDamageable extends IEntity {
    health: number;
    maxHealth: number;
    shield?: number; // Made optional to match legacy usually
    maxShield?: number;
    lastHitTime?: number; // Made optional
    lastShieldHitTime?: number;
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
    damage?: number;      // Pre-calculated damage (base * damageMult)
    isHoming?: boolean;
    turnRate?: number;
    maxDuration?: number;
    isElite?: boolean;
    level?: number;
    isLegendary?: boolean;
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
