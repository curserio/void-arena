import { Upgrade } from './items';
import { ShipType } from './ships';

export enum ModuleType {
    NONE = 'NONE',
    AFTERBURNER = 'AFTERBURNER',
    SHIELD_BURST = 'SHIELD_BURST',
    PHASE_SHIFT = 'PHASE_SHIFT',
    TIME_WARP = 'TIME_WARP'
}

/**
 * Individual module slot with its own cooldown state
 */
export interface ModuleSlot {
    type: ModuleType;
    cooldownMax: number;
    duration: number;
    power: number;
    readyTime: number;      // Timestamp when available
    activeUntil: number;    // Timestamp when effect ends
}

export enum ControlScheme {
    TWIN_STICK = 'TWIN_STICK',
    TAP_TO_AIM = 'TAP_TO_AIM',
    KEYBOARD_MOUSE = 'KEYBOARD_MOUSE'
}

// PowerUp ID strings for flexibility
export type PowerUpId = 'OVERDRIVE' | 'OMNI' | 'PIERCE' | 'SPEED' | 'HEALTH' | 'SHIELD';

export enum WeaponType {
    PLASMA = 'PLASMA',
    MISSILE = 'MISSILE',
    LASER = 'LASER',
    SWARM_LAUNCHER = 'SWARM_LAUNCHER',
    RAILGUN = 'RAILGUN',
    FLAK_CANNON = 'FLAK_CANNON',
    ENERGY_ORB = 'ENERGY_ORB',
    ARC_CASTER = 'ARC_CASTER',
    FLAMETHROWER = 'FLAMETHROWER'
}

export interface PlayerStats {
    maxHealth: number;
    currentHealth: number;
    maxShield: number;
    currentShield: number;
    shieldRegen: number;
    lastShieldHitTime: number;
    speed: number;
    fireRate: number;
    damage: number;
    bulletSpeed: number;
    bulletCount: number;
    magnetRange: number;
    xp: number;
    level: number;
    xpToNextLevel: number;
    pendingLevelUps: number; // Stored levels waiting to be spent
    weaponType: WeaponType;
    pierceCount: number;
    chainRange: number;
    hasShield: boolean;
    credits: number;
    shipType: ShipType;

    // Stored upgrade history (Only STAT upgrades)
    acquiredUpgrades: Upgrade[];

    invulnerableUntil: number;
    critChance: number;
    critMultiplier: number;
    creditMultiplier: number;

    // Weapon specific calculated stats
    areaSize: number;
    duration: number; // Generic projectile duration (ms)
    laserDuration: number;
    swarmCount: number;
    swarmAgility: number; // Turn speed in radians per sec

    // Module Stats (up to 3 slots with independent cooldowns)
    moduleSlots: ModuleSlot[];

    // Generic Active Buffs System
    // Key: PowerUpId, Value: Expiration Timestamp (ms)
    activeBuffs: Record<string, number>;

    // Death Recap
    combatLog: CombatLogEntry[];
}

export interface CombatLogEntry {
    timestamp: number;
    damage: number;
    source: string;
    isFatal: boolean;
    enemyLevel?: number;
}

export interface RunMetrics {
    shotsFired: number;
    shotsHit: number;
    enemiesKilled: number;
    creditsEarned: number;
}

export interface PowerUpConfig {
    id: PowerUpId;
    name: string;
    type: 'DURATION' | 'INSTANT';
    duration?: number; // ms
    weight: number; // For drop chance
    color: string;
    icon: string; // FontAwesome class
    label: string; // Short char for pickup render
    onPickup: (stats: PlayerStats, time: number) => PlayerStats;
}
