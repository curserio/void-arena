/**
 * Enemy-specific Type Definitions
 * Types for enemy system: types, tiers, definitions, modifiers
 */

import { Vector2D } from './entities';

// ============================================================================
// Enemy Types & Tiers
// ============================================================================

/**
 * All enemy types in the game
 */
export enum EnemyType {
    SCOUT = 'SCOUT',
    STRIKER = 'STRIKER',
    LASER_SCOUT = 'LASER_SCOUT',
    KAMIKAZE = 'KAMIKAZE',
    ASTEROID = 'ASTEROID',
    BOSS_DREADNOUGHT = 'BOSS_DREADNOUGHT',
    BOSS_DESTROYER = 'BOSS_DESTROYER',
}

/**
 * Enemy tier modifiers for regular enemies
 * Rarity: Normal > Elite > Legendary > Miniboss
 */
export enum EnemyTier {
    NORMAL = 'NORMAL',
    ELITE = 'ELITE',
    LEGENDARY = 'LEGENDARY',
    MINIBOSS = 'MINIBOSS',
}

/**
 * Boss tier modifiers (bosses cannot be miniboss)
 * Rarity: Normal > Elite > Legendary
 */
export enum BossTier {
    NORMAL = 'NORMAL',
    ELITE = 'ELITE',
    LEGENDARY = 'LEGENDARY',
}

/**
 * Movement behavior types
 */
export enum MovementBehavior {
    ORBIT = 'ORBIT',           // Scout: orbit around player
    CHASE = 'CHASE',           // Striker: direct chase with dash
    KITE = 'KITE',             // LaserScout: maintain distance
    CHARGE = 'CHARGE',         // Kamikaze: inertial charge
    DRIFT = 'DRIFT',           // Asteroid: float randomly
    BOSS_STANDARD = 'BOSS_STANDARD',     // Dreadnought
    BOSS_DESTROYER = 'BOSS_DESTROYER',   // Destroyer
}

/**
 * Attack pattern types
 */
export enum AttackPattern {
    NONE = 'NONE',             // Kamikaze: collision only
    SINGLE_SHOT = 'SINGLE_SHOT',
    CHARGED_BEAM = 'CHARGED_BEAM',
    TWIN_PLASMA = 'TWIN_PLASMA',
    MISSILE_SALVO = 'MISSILE_SALVO',
    BOSS_BEAM = 'BOSS_BEAM',
}

// ============================================================================
// Definition & Config Types
// ============================================================================

/**
 * Base stats definition for an enemy type
 */
export interface EnemyDefinition {
    type: EnemyType;
    baseHealth: number;
    baseRadius: number;
    baseSpeed: number;

    // Color config
    color: string | EnemyColorConfig;

    // Behavior
    movementBehavior: MovementBehavior;
    attackPattern: AttackPattern;
    attackCooldown: number;

    // Rewards
    xpValue: number;
    creditValue: number;
    powerUpChance: number;

    // Optional attack specifics
    projectileSpeed?: number;
    projectileRadius?: number;
    projectileColor?: string;

    // Guide / Lore
    name: string;
    description: string;
    role: string;
    guideIcon: string;

    // Boss-specific
    isBoss?: boolean;
    phases?: BossPhase[];

    // Attack damage values
    attacks?: AttackStats;
}

/**
 * Dynamic color generation config
 */
export interface EnemyColorConfig {
    hueMin: number;
    hueMax: number;
    saturation: number;
    lightness: number;
}

/**
 * Attack damage values for enemy types
 * Each enemy can have multiple attack types with different base damages
 */
export interface AttackStats {
    projectile?: number;  // Bullet damage
    explosion?: number;   // Kamikaze blast, splash effects
    beam?: number;        // Laser DPS per tick
    collision?: number;   // Melee collision (Striker only)
    missile?: number;     // Homing missile damage
}

/**
 * Boss phase definition
 */
export interface BossPhase {
    healthPercent: number;
    abilities: string[];
}

/**
 * Tier modifier config
 */
export interface TierModifier {
    healthMult: number;
    radiusMult: number;
    speedMult: number;
    damageMult: number;
    xpMult: number;
    creditMult: number;
    colorOverride?: string;
    glowColor?: string;
    hasShield?: boolean;
    shieldPercent?: number;
    specialAbilities?: string[];
}

/**
 * Tier spawn chances configuration
 */
export interface TierSpawnChances {
    elite: number;      // Base chance for elite
    legendary: number;  // Base chance for legendary
    miniboss: number;   // Base chance for miniboss (enemies only)
}

// ============================================================================
// Spawn & Creation Types
// ============================================================================

/**
 * Options for spawning an enemy
 */
export interface EnemySpawnOptions {
    x: number;
    y: number;
    tier?: EnemyTier;
    difficultyMult?: number;
    levelBonus?: number;
    isEliteOverride?: boolean;
    isLegendaryOverride?: boolean;
    isMinibossOverride?: boolean;
    bossWaveIndex?: number;
}

/**
 * Options for spawning a boss
 */
export interface BossSpawnOptions {
    x: number;
    y: number;
    tier?: BossTier;
    difficultyMult: number;
    levelBonus: number;
    waveIndex?: number;
}

/**
 * Factory creation result
 */
export interface EnemyCreateResult {
    enemy: IEnemy;
    shouldFlash: boolean;
}

/**
 * Interface all enemy instances must implement
 */
export interface IEnemy {
    readonly id: string;
    readonly enemyType: EnemyType;
    readonly tier: EnemyTier;

    // Position & Physics
    pos: Vector2D;
    vel: Vector2D;
    radius: number;

    // Health
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;

    // State
    isAlive: boolean;
    level: number;
    color: string;

    // Flags
    isElite: boolean;
    isLegendary: boolean;
    isMiniboss: boolean;
    isBoss: boolean;

    // Combat tracking
    lastHitTime: number;
    lastShieldHitTime: number;
    lastShotTime: number;

    // Damage scaling
    damageMult: number;

    // Slow effect
    slowUntil: number;
    slowFactor: number;

    // AI state
    aiPhase: number;
    aiSeed: number;

    // Combat & Rendering state
    isCharging: boolean;
    isFiring: boolean;
    chargeProgress: number;
    angle: number;
    hasDeathDefiance?: boolean;
    lastMissileTime?: number;
    lastSpawnTime?: number;

    // Methods
    update(context: import('./entities').UpdateContext): import('./entities').EnemyUpdateResult;
    takeDamage(amount: number, time: number): import('./entities').DamageResult;
    applySlowEffect(factor: number, until: number): void;
}
