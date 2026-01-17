/**
 * UpgradeCalculator
 * 
 * Calculates weapon and module modifiers from meta upgrades using declarative effects.
 * Replaces hardcoded weapon-specific logic in usePlayer.ts.
 */

import { WeaponType, ModuleType } from '../../../types';
import { META_UPGRADES } from '../../../constants';
import type { UpgradeEffect } from '../../../types/upgrades';

// ============================================================
// Weapon Modifiers
// ============================================================

export interface WeaponModifiers {
    damageMult: number;      // Multiplier for final damage
    fireRate: number;        // Multiplier for fire rate
    bulletSpeed: number;     // Multiplier for projectile speed
    bulletCount: number;     // Additional projectiles (additive from base)
    pierceCount: number;     // Pierce through enemies
    explosionRadius: number; // Multiplier for AOE radius
    swarmCount: number;      // Additional rockets per salvo
    swarmAgility: number;    // Multiplier for homing turn rate
    laserDuration: number;   // Multiplier for beam duration
}

const DEFAULT_WEAPON_MODS: WeaponModifiers = {
    damageMult: 1.0,
    fireRate: 1.0,
    bulletSpeed: 1.0,
    bulletCount: 0,       // Added to base
    pierceCount: 1,       // Default 1
    explosionRadius: 1.0, // Multiplier
    swarmCount: 0,        // Added to base 3
    swarmAgility: 1.0,    // Multiplier
    laserDuration: 1.0    // Multiplier
};

/**
 * Apply a single effect to modifiers
 */
function applyEffect(mods: Record<string, number>, effect: UpgradeEffect, level: number): void {
    const value = level * effect.perLevel;
    switch (effect.operation) {
        case 'add':
            mods[effect.stat] += value;
            break;
        case 'multiply':
            mods[effect.stat] *= value;
            break;
        case 'addPercent':
            mods[effect.stat] *= (1 + value);
            break;
    }
}

/**
 * Calculate weapon modifiers from meta upgrade levels
 */
export function calculateWeaponModifiers(
    weapon: WeaponType,
    metaLevels: Record<string, number>
): WeaponModifiers {
    const mods = { ...DEFAULT_WEAPON_MODS };

    // Get all upgrades for this weapon with declarative effects
    const upgrades = META_UPGRADES.filter(u => u.weaponType === weapon && u.effects?.length);

    for (const upgrade of upgrades) {
        const level = metaLevels[upgrade.id] || 0;
        if (level === 0 || !upgrade.effects) continue;

        // Apply ALL effects for this upgrade
        for (const effect of upgrade.effects) {
            applyEffect(mods as Record<string, number>, effect, level);
        }
    }

    return mods;
}

// ============================================================
// Module Modifiers
// ============================================================

export interface ModuleModifiers {
    duration: number;  // Additional duration in ms (additive)
    cooldown: number;  // Cooldown change in ms (additive, negative = reduction)
    power: number;     // Power multiplier
}

const DEFAULT_MODULE_MODS: ModuleModifiers = {
    duration: 0,
    cooldown: 0,
    power: 1.0
};

/**
 * Calculate module modifiers from meta upgrade levels
 */
export function calculateModuleModifiers(
    moduleType: ModuleType,
    metaLevels: Record<string, number>
): ModuleModifiers {
    const mods = { ...DEFAULT_MODULE_MODS };

    // Get all upgrades for this module with declarative effects
    const upgrades = META_UPGRADES.filter(u => u.moduleType === moduleType && u.effects?.length);

    for (const upgrade of upgrades) {
        const level = metaLevels[upgrade.id] || 0;
        if (level === 0 || !upgrade.effects) continue;

        // Apply ALL effects for this upgrade
        for (const effect of upgrade.effects) {
            applyEffect(mods as Record<string, number>, effect, level);
        }
    }

    return mods;
}

// ============================================================
// General Player Modifiers (HP, Shield, Speed, Crit, etc)
// ============================================================

export interface GeneralModifiers {
    maxHealth: number;      // Multiplier for max HP
    maxShield: number;      // Multiplier for max shield
    shieldRegen: number;    // Multiplier for shield regen
    speed: number;          // Multiplier for movement speed
    baseDamage: number;     // Multiplier for base damage (all weapons)
    critChance: number;     // Additive crit chance bonus
    critDamage: number;     // Multiplier for crit damage
    magnetRange: number;    // Multiplier for pickup range
    salvageBonus: number;   // Multiplier for credit bonus
}

const DEFAULT_GENERAL_MODS: GeneralModifiers = {
    maxHealth: 1.0,
    maxShield: 1.0,
    shieldRegen: 1.0,
    speed: 1.0,
    baseDamage: 1.0,
    critChance: 0,        // Additive
    critDamage: 1.0,
    magnetRange: 1.0,
    salvageBonus: 1.0
};

/**
 * Calculate general player modifiers from meta upgrade levels
 * These are upgrades without weaponType or moduleType (general progression)
 */
export function calculateGeneralModifiers(
    metaLevels: Record<string, number>
): GeneralModifiers {
    const mods = { ...DEFAULT_GENERAL_MODS };

    // Get all general upgrades (no weaponType, no moduleType)
    const upgrades = META_UPGRADES.filter(u => !u.weaponType && !u.moduleType && u.effects?.length);

    for (const upgrade of upgrades) {
        const level = metaLevels[upgrade.id] || 0;
        if (level === 0 || !upgrade.effects) continue;

        // Apply ALL effects for this upgrade
        for (const effect of upgrade.effects) {
            applyEffect(mods as Record<string, number>, effect, level);
        }
    }

    return mods;
}
