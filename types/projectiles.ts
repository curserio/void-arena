
import { IEntity, IRenderable, Vector2D, EntityType } from './entities';

// Re-export WeaponType from root types for now, or redefine if we want to decouple
// For now, let's redefine to keep it clean and eventually replace the root one
export enum ProjectileType {
    PLAYER_BULLET = 'PLAYER_BULLET',
    ENEMY_BULLET = 'ENEMY_BULLET'
}

export enum WeaponEffect {
    NONE = 'NONE',
    EXPLOSIVE = 'EXPLOSIVE',
    PIERCING = 'PIERCING',
    HOMING = 'HOMING',
    SPLIT = 'SPLIT',
    LASER = 'LASER' // Instant hit
}

export interface IProjectile extends IEntity, IRenderable {
    type: EntityType; // Aligned with IEntity
    damage: number;
    ownerId: string; // ID of the entity that fired this (for score/stats)

    // Movement
    direction: Vector2D;
    speed: number;
    angle?: number;

    // Lifecycle
    spawnTime: number;
    duration: number; // Max life in ms
    elapsedTime: number; // Current age in ms

    // Properties
    weaponEffect: WeaponEffect;
    pierceCount: number; // How many enemies it can hit before dying
    isCritical: boolean;

    // Homing (Optional)
    targetId?: string;
    turnRate?: number;

    // Laser Specific (Optional)
    isCharging?: boolean;
    chargeProgress?: number;
    isFiring?: boolean;
    width?: number;

    // Variant Info (Enemy Projectiles)
    level?: number;
    isElite?: boolean;
    isMiniboss?: boolean;
    isLegendary?: boolean;

    // Methods
    update(dt: number, time: number): void;
    onHit(targetId: string): void;
}

export interface ProjectileConfig {
    // Initial State
    pos: Vector2D;
    dir: Vector2D; // Normalized direction
    speed?: number;
    color?: string;
    radius?: number;

    // Stats
    damage: number;
    duration?: number;
    pierce?: number;
    critChance?: number;
    critMult?: number;

    // Type info
    type: EntityType; // Aligned
    weaponEffect?: WeaponEffect;
    ownerId: string;

    // Special
    targetId?: string; // For homing
    turnRate?: number;

    // Variant Info
    level?: number;
    isElite?: boolean;
    isMiniboss?: boolean;
    isLegendary?: boolean; // Added missing prop
}
