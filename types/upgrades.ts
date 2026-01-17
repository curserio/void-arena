
import { WeaponType, ModuleType } from './player';

// ============================================================
// Upgrade Effect System - Declarative upgrade definitions
// ============================================================

/**
 * Stats that can be modified by upgrades
 */
export type UpgradeStatKey =
    // Weapon stats
    | 'damageMult'       // Multiplier for damage
    | 'fireRate'         // Fire rate multiplier
    | 'bulletSpeed'      // Projectile speed multiplier
    | 'bulletCount'      // Additional projectiles (additive)
    | 'pierceCount'      // Pierce through enemies (additive)
    | 'explosionRadius'  // AOE radius (additive or multiplier)
    // Swarm-specific
    | 'swarmCount'       // Rockets per salvo (additive)
    | 'swarmAgility'     // Homing turn rate (multiplier)
    // Laser-specific
    | 'laserDuration'    // Beam duration (multiplier)
    // Module stats
    | 'duration'         // Module effect duration (additive ms)
    | 'cooldown'         // Module cooldown reduction (additive ms)
    | 'power';           // Module power/intensity (multiplier)

/**
 * How the upgrade value is applied
 */
export type UpgradeOperation =
    | 'add'          // stat += value
    | 'multiply'     // stat *= value
    | 'addPercent';  // stat *= (1 + value) - most common for +X% per level

/**
 * Declarative effect definition for a meta upgrade
 */
export interface UpgradeEffect {
    stat: UpgradeStatKey;
    perLevel: number;      // Value per upgrade level
    operation: UpgradeOperation;
}

/**
 * Meta upgrade with optional declarative effects
 */
export interface MetaUpgrade {
    id: string;
    name: string;
    description: string;
    icon: string;
    maxLevel: number;
    costBase: number;
    costFactor: number;
    weaponType?: WeaponType;
    moduleType?: ModuleType;
    effects?: UpgradeEffect[];  // Array of effects - supports multi-stat upgrades
}
