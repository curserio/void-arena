/**
 * Drop Configuration
 * Drop rates and reward multipliers for loot spawning
 */

import { EnemyType } from '../../types/enemies';

// ============================================================================
// XP Multipliers by Enemy Type
// ============================================================================

export const XP_MULTIPLIERS: Partial<Record<EnemyType, number>> = {
    [EnemyType.SCOUT]: 1,
    [EnemyType.STRIKER]: 3,
    [EnemyType.LASER_SCOUT]: 5,
    [EnemyType.KAMIKAZE]: 2,
    [EnemyType.ASTEROID]: 0.5,
    [EnemyType.BOSS_DESTROYER]: 20,
    [EnemyType.BOSS_DREADNOUGHT]: 20,
};

// ============================================================================
// Credit Base Values by Enemy Type
// ============================================================================

export const CREDIT_BASE_VALUES: Partial<Record<EnemyType, number>> = {
    [EnemyType.SCOUT]: 30,
    [EnemyType.STRIKER]: 60,
    [EnemyType.LASER_SCOUT]: 150,
    [EnemyType.KAMIKAZE]: 40,
    [EnemyType.ASTEROID]: 300,
    [EnemyType.BOSS_DESTROYER]: 1000,
    [EnemyType.BOSS_DREADNOUGHT]: 1000,
};

// ============================================================================
// Score Base Values by Enemy Type
// ============================================================================

export const SCORE_BASE_VALUES: Partial<Record<EnemyType, number>> = {
    [EnemyType.SCOUT]: 100,
    [EnemyType.STRIKER]: 250,
    [EnemyType.LASER_SCOUT]: 500,
    [EnemyType.KAMIKAZE]: 150,
    [EnemyType.ASTEROID]: 50,
    [EnemyType.BOSS_DESTROYER]: 5000,
    [EnemyType.BOSS_DREADNOUGHT]: 5000,
};

// ============================================================================
// Tier Reward Multipliers
// ============================================================================

export const TIER_REWARD_MULTIPLIERS = {
    normal: 1.0,
    elite: 5.0,
    miniboss: 15.0,
    legendary: 25.0,
    boss: 50.0,
};

// ============================================================================
// Drop Chances
// ============================================================================

export const DROP_CHANCES = {
    credit: {
        base: 0.33,
        elite: 1.0,
        miniboss: 1.0,
        legendary: 1.0,
        boss: 1.0,
    },
    powerUp: {
        base: 0.05,
        elite: 0.25,
        miniboss: 0.5,
        legendary: 0.75,
        boss: 1.0,
    },
};

// ============================================================================
// Level Scaling
// ============================================================================

export const LEVEL_SCALING = {
    xpPerLevel: 0.1,       // +10% XP per enemy level
    creditPerLevel: 0.2,   // +20% credits per enemy level
    scorePerLevel: 0.2,    // +20% score per enemy level
};

// ============================================================================
// Asteroid Special Drops
// ============================================================================

export const ASTEROID_DROPS = {
    creditMin: 300,
    creditMax: 600,
    xpValue: 10,
    score: 50,
};
