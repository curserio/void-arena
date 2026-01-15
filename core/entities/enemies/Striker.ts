/**
 * Striker Enemy
 * Melee-focused enemy that chases the player with dashing ability
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../types/entities';
import { EnemyType, EnemyTier, IEnemy, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';

export class Striker extends BaseEnemy {
    readonly enemyType = EnemyType.STRIKER;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;

    // Dash state
    private isDashing: boolean = false;
    private dashUntil: number = 0;

    constructor(
        id: string,
        pos: Vector2D,
        tier: EnemyTier,
        finalHealth: number,
        finalRadius: number,
        shield: number,
        color: string,
        level: number,
        baseSpeed: number
    ) {
        const definition = getEnemyDefinition(EnemyType.STRIKER);
        super(id, pos, definition, tier, finalHealth, finalRadius, shield, color, level);
        this.definition = definition;
        this.baseSpeed = baseSpeed;
    }

    update(context: UpdateContext): EnemyUpdateResult {
        const result = this.emptyResult();
        const { dt, time, playerPos, gameTime } = context;

        const speedMult = this.getSpeedMultiplier(time);
        const speedScale = 1 + (gameTime / 600) * 0.5;
        let speed = this.baseSpeed * speedScale * speedMult;

        if (this.isMiniboss) speed *= 0.65;
        if (this.isElite) speed *= 0.8;

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

        // Dash state
        if (this.isDashing) {
            if (time > this.dashUntil) {
                this.isDashing = false;
            }
        } else {
            // Normal chase with pulsing speed
            const pulse = 1.0 + Math.sin(time * 0.005 + this.aiPhase) * 0.2;
            this.vel.x = (dx / distToPlayer) * speed * pulse;
            this.vel.y = (dy / distToPlayer) * speed * pulse;
        }

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;



        return result;
    }
}
