/**
 * EnemyFactory
 * Factory for creating enemy instances from definitions and modifiers
 */

import { Vector2D } from '../../types/entities';
import {
    EnemyType,
    EnemyTier,
    BossTier,
    EnemySpawnOptions,
    IEnemy
} from '../../types/enemies';
import {
    ENEMY_DEFINITIONS,
    getEnemyDefinition,
    generateEnemyColor
} from '../../data/enemies/definitions';
import {
    ENEMY_MODIFIERS,
    BOSS_MODIFIERS,
    getTierModifier,
    getBossTierModifier,
    determineEnemyTier,
    determineBossTier,
    calculateShieldAmount
} from '../../data/enemies/modifiers';

// Enemy class imports
import { Scout } from '../entities/enemies/Scout';
import { Striker } from '../entities/enemies/Striker';
import { LaserScout } from '../entities/enemies/LaserScout';
import { Kamikaze } from '../entities/enemies/Kamikaze';
import { Asteroid } from '../entities/enemies/Asteroid';
import { Dreadnought } from '../entities/enemies/bosses/Dreadnought';
import { Destroyer } from '../entities/enemies/bosses/Destroyer';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';

export class EnemyFactory {
    private idCounter: number = 0;

    /**
     * Generate unique ID for enemy
     */
    private generateId(type: EnemyType): string {
        this.idCounter++;
        return `${type}-${this.idCounter}-${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * Determine tier based on options and game time
     */
    private determineTier(
        options: EnemySpawnOptions,
        gameMinutes: number
    ): EnemyTier {
        // Explicit overrides have priority
        if (options.isMinibossOverride) return EnemyTier.MINIBOSS;
        if (options.isLegendaryOverride) return EnemyTier.LEGENDARY;
        if (options.isEliteOverride) return EnemyTier.ELITE;
        if (options.tier) return options.tier;

        // Use tier determination function from modifiers
        return determineEnemyTier(gameMinutes);
    }

    /**
     * Create an enemy of the specified type
     */
    create(type: EnemyType, options: EnemySpawnOptions, currentTime: number = 0): IEnemy {
        const definition = getEnemyDefinition(type);
        const gameMinutes = (options.difficultyMult ?? 1) / 0.4; // Approximate from multiplier

        // Determine tier
        const tier = this.determineTier(options, gameMinutes);
        const modifier = getTierModifier(tier);

        // Calculate final stats
        const diffMult = options.difficultyMult ?? 1.0;
        const levelBonus = options.levelBonus ?? 0;

        const finalHealth = definition.baseHealth * diffMult * modifier.healthMult;
        const finalRadius = definition.baseRadius * modifier.radiusMult;
        const finalSpeed = definition.baseSpeed * modifier.speedMult;

        // Shield calculation
        let shield = 0;
        if (modifier.hasShield && modifier.shieldPercent) {
            shield = finalHealth * modifier.shieldPercent;
        } else if (gameMinutes > 5 && Math.random() > 0.7) {
            shield = finalHealth * 0.5;
        }

        // Color
        const seed = Math.random();
        let color = modifier.colorOverride ?? generateEnemyColor(definition, seed);

        // Level
        const level = Math.floor(diffMult) + levelBonus;

        // Position
        const pos: Vector2D = { x: options.x, y: options.y };

        // Create ID
        const id = this.generateId(type);

        // Create appropriate enemy class
        switch (type) {
            case EnemyType.SCOUT:
                return new Scout(
                    id, pos, tier, finalHealth, finalRadius,
                    shield, color, level, finalSpeed
                );

            case EnemyType.STRIKER:
                return new Striker(
                    id, pos, tier, finalHealth, finalRadius,
                    shield, color, level, finalSpeed
                );

            case EnemyType.LASER_SCOUT:
                return new LaserScout(
                    id, pos, tier, finalHealth, finalRadius,
                    shield, color, level, finalSpeed
                );

            case EnemyType.KAMIKAZE:
                return new Kamikaze(
                    id, pos, tier, finalHealth, finalRadius,
                    shield, color, level, finalSpeed
                );

            case EnemyType.BOSS_DREADNOUGHT:
                return new Dreadnought(
                    id, pos, finalHealth, finalRadius,
                    shield, color, level, currentTime
                );

            case EnemyType.BOSS_DESTROYER:
                return new Destroyer(
                    id, pos, finalHealth, finalRadius,
                    shield, color, level, currentTime
                );

            default:
                throw new Error(`Unknown enemy type: ${type}`);
        }
    }

    /**
     * Create an asteroid
     */
    createAsteroid(x: number, y: number, difficultyMult: number): Asteroid {
        const radius = 40 + Math.random() * 40;
        const health = radius * 3 * difficultyMult;
        const seed = Math.random();

        const vel: Vector2D = {
            x: (Math.random() - 0.5) * 40,
            y: (Math.random() - 0.5) * 40,
        };

        return new Asteroid(
            this.generateId(EnemyType.ASTEROID),
            { x, y },
            radius,
            health,
            '#475569',
            vel,
            seed
        );
    }

    /**
     * Create boss with wave-based scaling and boss tier
     */
    createBoss(
        type: EnemyType.BOSS_DREADNOUGHT | EnemyType.BOSS_DESTROYER,
        x: number,
        y: number,
        difficultyMult: number,
        levelBonus: number,
        currentTime: number,
        waveIndex: number = 0
    ): IEnemy {
        const definition = getEnemyDefinition(type);

        // Determine boss tier based on wave
        const bossTier = determineBossTier(waveIndex);
        const tierMod = getBossTierModifier(bossTier);

        // Boss scaling: quadratic based on wave + tier modifier
        const waveScaling = 1 + (waveIndex * 0.8) + (Math.pow(waveIndex, 2) * 0.5);

        const finalHealth = definition.baseHealth * difficultyMult * waveScaling * tierMod.healthMult;
        const finalRadius = definition.baseRadius * tierMod.radiusMult;

        // Boss shields - tier affects shield amount
        const baseShieldPercent = type === EnemyType.BOSS_DESTROYER ? 0.6 : 0.4;
        const shieldPercent = tierMod.shieldPercent ?? baseShieldPercent;
        const shield = finalHealth * shieldPercent;

        const level = Math.floor(difficultyMult) + 5 + levelBonus;

        // Color: tier override or default
        const color = tierMod.colorOverride ?? (definition.color as string);

        const id = type === EnemyType.BOSS_DESTROYER
            ? `BOSS-DEST-${bossTier}-${this.idCounter++}`
            : `BOSS-${bossTier}-${this.idCounter++}`;

        if (type === EnemyType.BOSS_DESTROYER) {
            return new Destroyer(
                id, { x, y }, finalHealth, finalRadius,
                shield, color, level, currentTime
            );
        } else {
            return new Dreadnought(
                id, { x, y }, finalHealth, finalRadius,
                shield, color, level, currentTime
            );
        }
    }
}

// Singleton instance
export const enemyFactory = new EnemyFactory();
