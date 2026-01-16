/**
 * Shielder Enemy
 * Support unit that creates shield bubble around nearby enemies
 * 
 * Uses: ShieldingBehavior, No attack (aura only)
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';
import { ShieldingBehavior, AIContext } from '../../systems/ai';

/**
 * Shielder grants damage reduction to nearby allies
 */
export const SHIELD_AURA_RADIUS = 150;
export const SHIELD_AURA_DAMAGE_REDUCTION = 0.5; // 50% damage reduction to shielded allies

export class Shielder extends BaseEnemy {
    readonly enemyType = EnemyType.SHIELDER;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;

    // AI Behaviors
    private readonly movement: ShieldingBehavior;

    // Aura pulse animation
    private auraPulse: number = 0;

    constructor(
        id: string,
        pos: Vector2D,
        tier: EnemyTier,
        finalHealth: number,
        finalRadius: number,
        shield: number,
        color: string,
        level: number,
        baseSpeed: number,
        damageMult: number
    ) {
        const definition = getEnemyDefinition(EnemyType.SHIELDER);
        super(id, pos, definition, tier, finalHealth, finalRadius, shield, color, level, damageMult);
        this.definition = definition;
        this.baseSpeed = baseSpeed;

        // Initialize behaviors
        this.movement = new ShieldingBehavior({
            preferredDistance: 80,
            searchRadius: 300,
            playerAvoidance: 250,
        });
    }

    /**
     * Get aura pulse value for rendering
     */
    getAuraPulse(): number {
        return this.auraPulse;
    }

    update(context: UpdateContext): EnemyUpdateResult {
        const result = this.emptyResult();
        const { dt, time, playerPos, gameTime, enemies } = context;

        // Update aura pulse animation
        this.auraPulse = 0.7 + Math.sin(time * 0.003) * 0.3;

        // Build AI context (include enemies for ally awareness)
        const aiCtx: AIContext = {
            enemy: this,
            playerPos,
            enemies: enemies as unknown as BaseEnemy[] | undefined,
            dt,
            time,
            gameTime,
        };

        // Calculate speed
        const speedMult = this.getSpeedMultiplier(time);
        const speedScale = 1 + (gameTime / 600) * 0.3; // Slower scaling than scouts
        let speed = this.baseSpeed * speedScale * speedMult;
        // Note: Tier speed modifiers already applied in factory via modifiers.ts

        // Movement via behavior
        const direction = this.movement.calculateVelocity(aiCtx);
        this.vel.x = direction.x * speed;
        this.vel.y = direction.y * speed;

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // No attacks - shielder is support only

        return result;
    }

    /**
     * Check if a position is within shield aura
     */
    isInAura(pos: Vector2D): boolean {
        const dx = pos.x - this.pos.x;
        const dy = pos.y - this.pos.y;
        return Math.hypot(dx, dy) <= SHIELD_AURA_RADIUS;
    }
}
