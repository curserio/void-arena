/**
 * LaserScout Enemy
 * Sniper-type enemy that maintains distance and fires charged beams
 * 
 * Uses: KiteBehavior, LaserAttack
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';
import { KiteBehavior, LaserAttack, AIContext } from '../../systems/ai';

export class LaserScout extends BaseEnemy {
    readonly enemyType = EnemyType.LASER_SCOUT;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;

    // AI Behaviors
    private readonly movement: KiteBehavior;
    private readonly attack: LaserAttack;

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
        const definition = getEnemyDefinition(EnemyType.LASER_SCOUT);
        super(id, pos, definition, tier, finalHealth, finalRadius, shield, color, level, damageMult);
        this.definition = definition;
        this.baseSpeed = baseSpeed;

        // Initialize behaviors
        this.movement = new KiteBehavior({
            optimalRange: 600,
            retreatSpeed: 1.2,
            strafeAmount: 0.8,
        });

        this.attack = new LaserAttack({
            cooldown: definition.attackCooldown,
            chargeTime: 2.0,
            fireTime: 1.25,
            range: 850,
            trackingFactor: 0.1,
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
        let speed = this.baseSpeed * speedScale * speedMult;

        if (this.isMiniboss) speed *= 0.65;
        if (this.isElite) speed *= 0.8;

        // Movement - stop when attacking
        if (this.isFiring || this.isCharging) {
            this.vel.x = 0;
            this.vel.y = 0;
        } else {
            const direction = this.movement.calculateVelocity(aiCtx);
            this.vel.x = direction.x * speed;
            this.vel.y = direction.y * speed;
        }

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Attack - check if should start
        if (this.attack.shouldAttack(aiCtx)) {
            this.attack.startCharge(aiCtx);
        }

        // Update attack state (charging/firing)
        this.attack.updateState(aiCtx);

        return result;
    }
}
