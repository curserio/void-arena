
import { WeaponType, ModuleType } from './player';

// ============================================================
// Upgrade Effect System - Declarative upgrade definitions
// ============================================================

/**
 * Stats that can be modified by upgrades
 */
export type UpgradeStatKey =
    // General player stats
    | 'maxHealth'        // Max HP multiplier
    | 'maxShield'        // Max shield multiplier
    | 'shieldRegen'      // Shield regen multiplier
    | 'speed'            // Movement speed multiplier
    | 'baseDamage'       // Base damage multiplier (applies to all weapons)
    | 'critChance'       // Critical chance additive
    | 'critDamage'       // Critical damage multiplier
    | 'magnetRange'      // Pickup range multiplier
    | 'salvageBonus'     // Credit bonus multiplier
    // Weapon stats
    | 'damageMult'       // Weapon-specific damage multiplier
    | 'fireRate'         // Fire rate multiplier
    | 'bulletSpeed'      // Projectile speed multiplier
    | 'bulletCount'      // Additional projectiles (additive)
    | 'pierceCount'      // Pierce through enemies (additive)
    | 'explosionRadius'  // AOE radius multiplier
    // Swarm-specific
    | 'swarmCount'       // Rockets per salvo (additive)
    | 'swarmAgility'     // Homing turn rate multiplier
    // Laser-specific
    | 'laserDuration'    // Beam duration multiplier
    // Module stats
    | 'duration'         // Module effect duration (additive ms)
    | 'cooldown'         // Module cooldown change (additive ms)
    | 'power';           // Module power/intensity multiplier

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
