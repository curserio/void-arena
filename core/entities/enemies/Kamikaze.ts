/**
 * Kamikaze Enemy
 * Fast suicide bomber that charges at the player with inertial movement
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../types/entities';
import { EnemyType, EnemyTier, IEnemy, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';

export class Kamikaze extends BaseEnemy {
    readonly enemyType = EnemyType.KAMIKAZE;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;
    private readonly turnRate: number = 2.5;

    // Elite ability
    public hasDeathDefiance: boolean;

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
    }

    update(context: UpdateContext): EnemyUpdateResult {
        const result = this.emptyResult();
        const { dt, time, playerPos, gameTime } = context;

        const speedMult = this.getSpeedMultiplier(time);
        const speedScale = 1 + (gameTime / 600) * 0.5;
        let maxSpeed = this.baseSpeed * speedScale * speedMult;

        // Kamikaze: No miniboss/elite speed penalty - they stay fast

        const dx = playerPos.x - this.pos.x;
        const dy = playerPos.y - this.pos.y;
        const distToPlayer = Math.hypot(dx, dy);
        const targetDirX = dx / distToPlayer;
        const targetDirY = dy / distToPlayer;

        // Inertial steering
        const currentSpeed = Math.hypot(this.vel.x, this.vel.y);

        let newDirX = targetDirX;
        let newDirY = targetDirY;

        if (currentSpeed > 50) {
            // Gradually turn towards target
            const normVelX = this.vel.x / currentSpeed;
            const normVelY = this.vel.y / currentSpeed;

            const turnAmount = this.turnRate * dt;
            newDirX = normVelX + (targetDirX - normVelX) * turnAmount;
            newDirY = normVelY + (targetDirY - normVelY) * turnAmount;

            // Normalize
            const len = Math.hypot(newDirX, newDirY);
            newDirX /= len;
            newDirY /= len;
        }

        // Speed adjustment based on alignment
        const alignment = newDirX * targetDirX + newDirY * targetDirY;
        let newSpeed = currentSpeed;

        if (currentSpeed < 50) {
            // Initial acceleration
            newSpeed = maxSpeed;
        } else if (alignment > 0.9) {
            // Accelerate when aligned
            const acceleration = 250 * dt;
            newSpeed = Math.min(maxSpeed, currentSpeed + acceleration);
        } else {
            // Slow down when turning
            newSpeed = Math.max(100, currentSpeed * 0.97);
        }

        // Apply movement
        this.vel.x = newDirX * newSpeed;
        this.vel.y = newDirY * newSpeed;

        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Kamikaze has no projectile attack - damage is on collision

        return result;
    }
}
