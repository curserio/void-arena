/**
 * Striker Enemy
 * Melee-focused enemy that chases the player with dashing ability
 * 
 * Uses: ChaseBehavior (with custom dash logic)
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';
import { ChaseBehavior, AIContext } from '../../systems/ai';

export class Striker extends BaseEnemy {
    readonly enemyType = EnemyType.STRIKER;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;

    // Dash state
    private isDashing: boolean = false;
    private dashUntil: number = 0;

    // AI Behaviors
    private readonly movement: ChaseBehavior;

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
        const definition = getEnemyDefinition(EnemyType.STRIKER);
        super(id, pos, definition, tier, finalHealth, finalRadius, shield, color, level, damageMult);
        this.definition = definition;
        this.baseSpeed = baseSpeed;

        // Initialize behaviors
        this.movement = new ChaseBehavior({
            pulseEnabled: true,
            pulseAmount: 0.2,
            pulseSpeed: 0.005,
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

        // Distance to player for dash logic
        const dx = playerPos.x - this.pos.x;
        const dy = playerPos.y - this.pos.y;
        const distToPlayer = Math.hypot(dx, dy);

        // Dash initiation
        if (distToPlayer < 250 && !this.isDashing && time - this.lastShotTime > 5000) {
            this.isDashing = true;
            this.dashUntil = time + 600;
            this.lastShotTime = time;

            // Dash velocity
            this.vel.x = (dx / distToPlayer) * speed * 3.5;
            this.vel.y = (dy / distToPlayer) * speed * 3.5;
        }

        // Dash state handling
        if (this.isDashing) {
            if (time > this.dashUntil) {
                this.isDashing = false;
            }
            // Keep current dash velocity
        } else {
            // Normal chase via behavior
            const direction = this.movement.calculateVelocity(aiCtx);
            this.vel.x = direction.x * speed;
            this.vel.y = direction.y * speed;
        }

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        return result;
    }
}
