/**
 * Wave Configuration Data
 * Data-driven configuration for wave timing, spawn rates, and enemy type thresholds
 */

import { GameDifficulty } from '../../types/game';

// ============================================================================
// Interfaces
// ============================================================================

export interface SpawnRateConfig {
    base: number;           // Base spawn delay in seconds
    min: number;            // Minimum spawn delay
    decayPerSecond: number; // How much faster spawns get over time (1/x)
    rushMultiplier: number; // Speed multiplier during rush hour
}

export interface EnemyTypeRolls {
    laserScoutThreshold: number;   // Roll > this = laser scout
    laserScoutUnlockTime: number;  // Seconds until laser scouts can spawn
    strikerThreshold: number;      // Roll > this = striker (if not laser)
    shielderThreshold: number;     // Roll > this = shielder (after unlock)
    shielderUnlockTime: number;    // Seconds until shielders can spawn
    carrierThreshold: number;      // Roll > this = carrier (after unlock)
    carrierUnlockTime: number;     // Seconds until carriers can spawn
    kamikazeThreshold: number;     // Roll > this = kamikaze wave chance
    kamikazeUnlockTime: number;    // Seconds until kamikaze waves
    kamikazeCooldown: number;      // Minimum seconds between kamikaze waves
    kamikazeMinCount: number;      // Minimum kamikazes per wave
    kamikazeMaxCount: number;      // Maximum kamikazes per wave
    eliteWaveChance: number;       // Chance for elite kamikaze wave
}

export interface WaveConfig {
    // Wave timing
    waveDuration: number;       // Active wave duration in seconds
    lullDuration: number;       // Rest period between waves
    rushHourDuration: number;   // Intense period before wave end

    // Boss spawning
    bossInterval: number;       // Seconds between boss spawns
    destroyerChance: number;    // Chance for Destroyer vs Dreadnought

    // Spawn rates
    spawnRates: SpawnRateConfig;

    // Enemy type selection
    enemyTypeRolls: EnemyTypeRolls;

    // Lull period spawning
    lullSpawnDelay: number;     // Seconds between lull spawns
    lullSpawnChance: number;    // Chance to spawn during lull
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_WAVE_CONFIG: WaveConfig = {
    // Wave timing
    waveDuration: 45,
    lullDuration: 10,
    rushHourDuration: 15,

    // Boss spawning
    bossInterval: 180,  // 3 minutes
    destroyerChance: 0.35,

    // Spawn rates
    spawnRates: {
        base: 1.5,
        min: 0.2,
        decayPerSecond: 400,  // spawnDelay = max(min, base - gameTime/decay)
        rushMultiplier: 2.5,
    },

    // Enemy type selection
    enemyTypeRolls: {
        laserScoutThreshold: 0.85,
        laserScoutUnlockTime: 90,
        strikerThreshold: 0.65,
        shielderThreshold: 0.80,     // 80-85% = shielder
        shielderUnlockTime: 180,     // Unlocks at 3 minutes
        carrierThreshold: 0.78,      // 78-80% = carrier
        carrierUnlockTime: 300,      // Unlocks at 5 minutes
        kamikazeThreshold: 0.93,
        kamikazeUnlockTime: 45,
        kamikazeCooldown: 20,
        kamikazeMinCount: 2,
        kamikazeMaxCount: 5,
        eliteWaveChance: 0.2,
    },

    // Lull period
    lullSpawnDelay: 3.0,
    lullSpawnChance: 0.5,
};

// ============================================================================
// Difficulty-specific Configurations
// ============================================================================

export const DIFFICULTY_WAVE_CONFIGS: Partial<Record<GameDifficulty, Partial<WaveConfig>>> = {
    [GameDifficulty.HARD]: {
        waveDuration: 50,
        rushHourDuration: 20,
        spawnRates: {
            ...DEFAULT_WAVE_CONFIG.spawnRates,
            base: 1.2,
            rushMultiplier: 3.0,
        },
    },
    [GameDifficulty.NIGHTMARE]: {
        waveDuration: 55,
        rushHourDuration: 25,
        bossInterval: 150,  // More frequent bosses
        spawnRates: {
            ...DEFAULT_WAVE_CONFIG.spawnRates,
            base: 1.0,
            min: 0.15,
            rushMultiplier: 3.5,
        },
    },
    [GameDifficulty.HELL]: {
        waveDuration: 60,
        lullDuration: 5,  // Shorter rest
        rushHourDuration: 30,
        bossInterval: 120,  // Every 2 minutes
        spawnRates: {
            ...DEFAULT_WAVE_CONFIG.spawnRates,
            base: 0.8,
            min: 0.1,
            rushMultiplier: 4.0,
        },
    },
};

/**
 * Get wave config for a specific difficulty, merging with defaults
 */
export function getWaveConfig(difficulty: GameDifficulty): WaveConfig {
    const override = DIFFICULTY_WAVE_CONFIGS[difficulty];
    if (!override) return DEFAULT_WAVE_CONFIG;

    return {
        ...DEFAULT_WAVE_CONFIG,
        ...override,
        spawnRates: {
            ...DEFAULT_WAVE_CONFIG.spawnRates,
            ...(override.spawnRates || {}),
        },
        enemyTypeRolls: {
            ...DEFAULT_WAVE_CONFIG.enemyTypeRolls,
            ...(override.enemyTypeRolls || {}),
        },
    };
}
