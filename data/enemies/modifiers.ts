/**
 * Enemy Tier Modifiers
 * Configuration for Normal, Elite, Legendary, Miniboss scaling
 * Also includes Boss tier modifiers
 */

import { EnemyTier, TierModifier, TierSpawnChances } from '../../types/enemies';

// ============================================================================
// Enemy Tier Modifiers (for regular enemies)
// ============================================================================

export const ENEMY_MODIFIERS: Record<EnemyTier, TierModifier> = {
    [EnemyTier.NORMAL]: {
        healthMult: 1.0,
        radiusMult: 1.0,
        speedMult: 1.0,
        damageMult: 1.0,
        xpMult: 1.0,
        creditMult: 1.0,
    },

    [EnemyTier.ELITE]: {
        healthMult: 3.0,
        radiusMult: 1.3,
        speedMult: 0.9,
        damageMult: 1.5,
        xpMult: 3.0,
        creditMult: 2.5,
        colorOverride: '#d946ef', // Magenta/Fuchsia
        glowColor: '#f0abfc',
        hasShield: true,
        shieldPercent: 0.5,
        specialAbilities: ['hasDeathDefiance'],
    },

    [EnemyTier.LEGENDARY]: {
        healthMult: 8.0,
        radiusMult: 1.6,
        speedMult: 0.85,
        damageMult: 2.0,
        xpMult: 8.0,
        creditMult: 6.0,
        colorOverride: '#fbbf24', // Gold/Amber
        glowColor: '#fef08a',
        hasShield: true,
        shieldPercent: 0.6,
        specialAbilities: ['hasDeathDefiance', 'enrage'],
    },

    [EnemyTier.MINIBOSS]: {
        healthMult: 15.0,
        radiusMult: 2.0,
        speedMult: 0.75,
        damageMult: 2.5,
        xpMult: 15.0,
        creditMult: 10.0,
        colorOverride: '#ef4444', // Red
        glowColor: '#fca5a5',
        hasShield: true,
        shieldPercent: 0.4,
        specialAbilities: ['enrage', 'summon'],
    },
};

// ============================================================================
// Boss Tier Modifiers (bosses cannot be miniboss)
// ============================================================================

export const BOSS_MODIFIERS: Record<EnemyTier, TierModifier> = {
    [EnemyTier.NORMAL]: {
        healthMult: 1.0,
        radiusMult: 1.0,
        speedMult: 1.0,
        damageMult: 1.0,
        xpMult: 1.0,
        creditMult: 1.0,
    },

    [EnemyTier.ELITE]: {
        healthMult: 2.0,
        radiusMult: 1.15,
        speedMult: 1.1,
        damageMult: 1.5,
        xpMult: 2.5,
        creditMult: 2.0,
        colorOverride: '#d946ef', // Magenta
        glowColor: '#f0abfc',
        hasShield: true,
        shieldPercent: 0.7,
        specialAbilities: ['enrage'],
    },

    [EnemyTier.LEGENDARY]: {
        healthMult: 4.0,
        radiusMult: 1.25,
        speedMult: 1.2,
        damageMult: 2.0,
        xpMult: 5.0,
        creditMult: 4.0,
        colorOverride: '#fbbf24', // Gold
        glowColor: '#fef08a',
        hasShield: true,
        shieldPercent: 0.8,
        specialAbilities: ['enrage', 'summon', 'berserk'],
    },

    // Bosses don't spawn as MINIBOSS, but we need this for type completeness
    [EnemyTier.MINIBOSS]: {
        healthMult: 1.0,
        radiusMult: 1.0,
        speedMult: 1.0,
        damageMult: 1.0,
        xpMult: 1.0,
        creditMult: 1.0,
    },
};

// ============================================================================
// Spawn Chance Configuration
// ============================================================================

/**
 * Base spawn chances for enemy tiers
 * These scale with game time
 */
export const ENEMY_TIER_SPAWN_CHANCES: TierSpawnChances = {
    elite: 0.08,      // 8% base chance
    legendary: 0.02,  // 2% base chance
    miniboss: 0.01,   // 1% base chance
};

/**
 * Base spawn chances for boss tiers
 */
export const BOSS_TIER_SPAWN_CHANCES: Omit<TierSpawnChances, 'miniboss'> = {
    elite: 0.20,      // 20% chance for elite boss
    legendary: 0.05,  // 5% chance for legendary boss
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get modifier for enemy tier
 */
export function getTierModifier(tier: EnemyTier): TierModifier {
    return ENEMY_MODIFIERS[tier];
}

/**
 * Get modifier for boss tier
 */
export function getBossTierModifier(tier: EnemyTier): TierModifier {
    return BOSS_MODIFIERS[tier];
}

/**
 * Determine enemy tier based on game time and random roll
 */
export function determineEnemyTier(gameMinutes: number): EnemyTier {
    // Tier chances scale with time
    const timeScale = Math.min(2.0, 1 + gameMinutes / 10);

    const roll = Math.random();
    let cumulative = 0;

    // Miniboss check (rarest)
    cumulative += ENEMY_TIER_SPAWN_CHANCES.miniboss * timeScale;
    if (roll < cumulative && gameMinutes > 2) {
        return EnemyTier.MINIBOSS;
    }

    // Legendary check
    cumulative += ENEMY_TIER_SPAWN_CHANCES.legendary * timeScale;
    if (roll < cumulative && gameMinutes > 1.5) {
        return EnemyTier.LEGENDARY;
    }

    // Elite check
    cumulative += ENEMY_TIER_SPAWN_CHANCES.elite * timeScale;
    if (roll < cumulative && gameMinutes > 0.5) {
        return EnemyTier.ELITE;
    }

    return EnemyTier.NORMAL;
}

/**
 * Determine boss tier based on wave number and random roll
 */
export function determineBossTier(waveIndex: number): EnemyTier {
    // Later waves have higher chances for special bosses
    const waveScale = 1 + waveIndex * 0.3;

    const roll = Math.random();
    let cumulative = 0;

    // Legendary check (rarest)
    cumulative += BOSS_TIER_SPAWN_CHANCES.legendary * waveScale;
    if (roll < cumulative && waveIndex >= 2) {
        return EnemyTier.LEGENDARY;
    }

    // Elite check
    cumulative += BOSS_TIER_SPAWN_CHANCES.elite * waveScale;
    if (roll < cumulative && waveIndex >= 1) {
        return EnemyTier.ELITE;
    }

    return EnemyTier.NORMAL;
}

/**
 * Calculate if enemy should have shield based on tier and time
 */
export function shouldHaveShield(
    tier: EnemyTier,
    gameMinutes: number
): boolean {
    const mod = ENEMY_MODIFIERS[tier];

    // Elite/Legendary/Miniboss always have shields
    if (mod.hasShield) return true;

    // Normal enemies: chance increases with time
    if (gameMinutes > 5) {
        return Math.random() > 0.7;
    }

    return false;
}

/**
 * Calculate shield amount
 */
export function calculateShieldAmount(
    tier: EnemyTier,
    baseHealth: number,
    gameMinutes: number
): number {
    const mod = ENEMY_MODIFIERS[tier];

    if (mod.shieldPercent) {
        return baseHealth * mod.shieldPercent;
    }

    // Late-game normal enemies
    if (gameMinutes > 5 && Math.random() > 0.7) {
        return baseHealth * 0.5;
    }

    return 0;
}
