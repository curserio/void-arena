/**
 * Kamikaze Enemy
 * Fast suicide bomber that charges at the player with inertial movement
 * 
 * Uses: RushBehavior
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';
import { RushBehavior, AIContext } from '../../systems/ai';

export class Kamikaze extends BaseEnemy {
    readonly enemyType = EnemyType.KAMIKAZE;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;

    // Elite ability
    public hasDeathDefiance: boolean;

    // AI Behaviors
    private readonly movement: RushBehavior;

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
        const definition = getEnemyDefinition(EnemyType.KAMIKAZE);
        super(id, pos, definition, tier, finalHealth, finalRadius, shield, color, level, damageMult);
        this.definition = definition;
        this.baseSpeed = baseSpeed;

        // Special ability: Death Defiance for all tiers above Normal
        this.hasDeathDefiance = tier !== EnemyTier.NORMAL;

        // Initialize behaviors
        this.movement = new RushBehavior({
            turnRate: 2.5,
            acceleration: 250,
            minSpeed: 100,
        });
    }

    update(context: UpdateContext): EnemyUpdateResult {
        const result = this.emptyResult();
        const { dt, time, playerPos, gameTime } = context;

        // Build AI context
        const aiCtx: AIContext = {
            enemy: this,
            playerPos,
            dt,
            time,
            gameTime,
        };

        // Calculate speed
        const speedMult = this.getSpeedMultiplier(time);
        const speedScale = 1 + (gameTime / 600) * 0.5;
        const maxSpeed = this.baseSpeed * speedScale * speedMult;
        // Kamikaze: No miniboss/elite speed penalty - they stay fast

        // Get direction from rush behavior
        const direction = this.movement.calculateVelocity(aiCtx);

        // Apply speed with acceleration logic
        const currentSpeed = Math.hypot(this.vel.x, this.vel.y);
        let newSpeed = maxSpeed;

        if (currentSpeed > 50) {
            // Calculate alignment for speed adjustment
            const speedMult = this.movement.calculateSpeedMultiplier(aiCtx);
            if (speedMult > 0.9) {
                // Accelerate when aligned
                const acceleration = 250 * dt;
                newSpeed = Math.min(maxSpeed, currentSpeed + acceleration);
            } else {
                // Slow down when turning
                newSpeed = Math.max(100, currentSpeed * 0.97);
            }
        }

        // Apply movement
        this.vel.x = direction.x * newSpeed;
        this.vel.y = direction.y * newSpeed;

        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Kamikaze has no projectile attack - damage is on collision

        return result;
    }
}
