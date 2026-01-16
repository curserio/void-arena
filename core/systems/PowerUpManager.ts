/**
 * PowerUp Manager
 * Centralized power-up logic: buff management, drop calculation, effect application
 */

import { Entity, EntityType, PlayerStats, PowerUpId, DifficultyConfig } from '../../types';
import { pickupIdGen } from '../utils/IdGenerator';
import { EnemyType, IEnemy } from '../../types/enemies';
import { XP_PER_GEM } from '../../constants';
import {
    POWERUP_CONFIGS,
    XP_MULTIPLIERS,
    CREDIT_BASE_VALUES,
    SCORE_BASE_VALUES,
    TIER_REWARD_MULTIPLIERS,
    DROP_CHANCES,
    LEVEL_SCALING,
    ASTEROID_DROPS,
} from '../../data/powerups';

// ============================================================================
// Types
// ============================================================================

export interface DropResult {
    drops: Entity[];
    score: number;
}

// ============================================================================
// PowerUp Manager Class
// ============================================================================

export class PowerUpManager {
    // ========================================================================
    // Buff Management
    // ========================================================================

    /**
     * Apply a duration buff to player stats
     */
    applyBuff(stats: PlayerStats, id: PowerUpId, time: number): PlayerStats {
        const config = POWERUP_CONFIGS[id];
        if (!config || config.type !== 'DURATION' || !config.duration) {
            return stats;
        }

        return {
            ...stats,
            activeBuffs: {
                ...stats.activeBuffs,
                [id]: time + config.duration,
            },
        };
    }

    /**
     * Check if a buff is currently active
     */
    isBuffActive(stats: PlayerStats, id: PowerUpId, time: number): boolean {
        const expiry = stats.activeBuffs[id];
        return expiry !== undefined && expiry > time;
    }

    /**
     * Get all currently active buffs
     */
    getActiveBuffs(stats: PlayerStats, time: number): PowerUpId[] {
        const active: PowerUpId[] = [];
        for (const [id, expiry] of Object.entries(stats.activeBuffs)) {
            if (expiry > time) {
                active.push(id as PowerUpId);
            }
        }
        return active;
    }

    // ========================================================================
    // Effect Application
    // ========================================================================

    /**
     * Apply a power-up's effect when collected
     */
    applyPickupEffect(powerUpId: PowerUpId, stats: PlayerStats, time: number): PlayerStats {
        const config = POWERUP_CONFIGS[powerUpId];
        if (!config) return stats;

        if (config.type === 'DURATION') {
            return this.applyBuff(stats, powerUpId, time);
        }

        // Instant effects
        switch (powerUpId) {
            case 'HEALTH':
                return {
                    ...stats,
                    currentHealth: Math.min(stats.maxHealth, stats.currentHealth + stats.maxHealth * 0.35),
                };
            case 'SHIELD':
                return {
                    ...stats,
                    currentShield: stats.maxShield,
                };
            default:
                return stats;
        }
    }

    // ========================================================================
    // Random Selection
    // ========================================================================

    /**
     * Get a weighted random power-up ID
     */
    getWeightedRandomPowerUp(): PowerUpId {
        const items = Object.values(POWERUP_CONFIGS);
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            if (random < item.weight) {
                return item.id;
            }
            random -= item.weight;
        }
        return 'OVERDRIVE';
    }

    // ========================================================================
    // Drop Calculation
    // ========================================================================

    /**
     * Calculate drops for a killed enemy
     */
    calculateDrops(enemy: IEnemy, difficulty: DifficultyConfig): DropResult {
        const drops: Entity[] = [];
        const enemyType = enemy.enemyType;

        // Special: Asteroid drops
        if (enemyType === EnemyType.ASTEROID) {
            return this.calculateAsteroidDrops(enemy);
        }

        const level = enemy.level || 1;
        const lootMult = difficulty.lootMultiplier;

        // Determine tier multiplier
        const rewardMult = this.getRewardMultiplier(enemy);
        const levelMult = 1 + level * LEVEL_SCALING.scorePerLevel;

        // 1. Score Calculation
        const baseScore = SCORE_BASE_VALUES[enemyType] || 100;
        const finalScore = Math.floor(baseScore * levelMult * rewardMult);

        // 2. XP Drop
        const xpMult = XP_MULTIPLIERS[enemyType] || 1;
        const xpValue = Math.ceil(
            XP_PER_GEM * xpMult * (1 + level * LEVEL_SCALING.xpPerLevel) * rewardMult * lootMult
        );

        drops.push(this.createXpGem(enemy.pos, xpValue));

        // 3. Credit Drop
        const creditChance = this.getCreditDropChance(enemy);
        if (Math.random() < creditChance) {
            const baseCredits = CREDIT_BASE_VALUES[enemyType] || 30;
            const creditValue = Math.floor(
                baseCredits * (1 + level * LEVEL_SCALING.creditPerLevel) * rewardMult * lootMult
            );
            drops.push(this.createCredit(enemy.pos, creditValue));
        }

        // 4. PowerUp Drop
        const powerUpChance = this.getPowerUpDropChance(enemy);
        if (Math.random() < powerUpChance) {
            const powerUpId = this.getWeightedRandomPowerUp();
            drops.push(this.createPowerUp(enemy.pos, powerUpId));
        }

        return { drops, score: finalScore };
    }

    // ========================================================================
    // Private Helpers
    // ========================================================================

    private getRewardMultiplier(enemy: IEnemy): number {
        if (enemy.isBoss) return TIER_REWARD_MULTIPLIERS.boss;
        if (enemy.isLegendary) return TIER_REWARD_MULTIPLIERS.legendary;
        if (enemy.isMiniboss) return TIER_REWARD_MULTIPLIERS.miniboss;
        if (enemy.isElite) return TIER_REWARD_MULTIPLIERS.elite;
        return TIER_REWARD_MULTIPLIERS.normal;
    }

    private getCreditDropChance(enemy: IEnemy): number {
        if (enemy.isBoss) return DROP_CHANCES.credit.boss;
        if (enemy.isLegendary) return DROP_CHANCES.credit.legendary;
        if (enemy.isMiniboss) return DROP_CHANCES.credit.miniboss;
        if (enemy.isElite) return DROP_CHANCES.credit.elite;
        return DROP_CHANCES.credit.base;
    }

    private getPowerUpDropChance(enemy: IEnemy): number {
        if (enemy.isBoss) return DROP_CHANCES.powerUp.boss;
        if (enemy.isLegendary) return DROP_CHANCES.powerUp.legendary;
        if (enemy.isMiniboss) return DROP_CHANCES.powerUp.miniboss;
        if (enemy.isElite) return DROP_CHANCES.powerUp.elite;
        return DROP_CHANCES.powerUp.base;
    }

    private calculateAsteroidDrops(enemy: IEnemy): DropResult {
        const drops: Entity[] = [];
        const creditVal = ASTEROID_DROPS.creditMin +
            Math.floor(Math.random() * (ASTEROID_DROPS.creditMax - ASTEROID_DROPS.creditMin));

        drops.push(this.createCredit(enemy.pos, creditVal, 22));
        drops.push(this.createXpGem(
            { x: enemy.pos.x + (Math.random() - 0.5) * 30, y: enemy.pos.y + (Math.random() - 0.5) * 30 },
            ASTEROID_DROPS.xpValue
        ));

        return { drops, score: ASTEROID_DROPS.score };
    }

    private createXpGem(pos: { x: number; y: number }, value: number): Entity {
        return {
            id: pickupIdGen.next(),
            type: EntityType.XP_GEM,
            pos: { ...pos },
            vel: { x: 0, y: 0 },
            radius: 14,
            health: 1,
            maxHealth: 1,
            color: '#06b6d4',
            value,
            isAlive: true,
        };
    }

    private createCredit(pos: { x: number; y: number }, value: number, radius = 15): Entity {
        return {
            id: pickupIdGen.next(),
            type: EntityType.CREDIT,
            pos: { ...pos },
            vel: { x: 0, y: 0 },
            radius,
            health: 1,
            maxHealth: 1,
            color: '#fbbf24',
            value,
            isAlive: true,
        };
    }

    private createPowerUp(pos: { x: number; y: number }, powerUpId: PowerUpId): Entity {
        const config = POWERUP_CONFIGS[powerUpId];
        return {
            id: pickupIdGen.next(),
            type: EntityType.POWERUP,
            pos: { ...pos },
            vel: { x: 0, y: 0 },
            radius: 24,
            health: 1,
            maxHealth: 1,
            color: config.color,
            powerUpId,
            isAlive: true,
        };
    }
}

// Singleton instance
export const powerUpManager = new PowerUpManager();

