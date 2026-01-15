/**
 * LaserScout Enemy
 * Sniper-type enemy that maintains distance and fires charged beams
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../types/entities';
import { EnemyType, EnemyTier, IEnemy, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';

export class LaserScout extends BaseEnemy {
    readonly enemyType = EnemyType.LASER_SCOUT;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;
    private readonly optimalRange: number = 600;

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
        const definition = getEnemyDefinition(EnemyType.LASER_SCOUT);
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
        const orbitDir = this.aiSeed > 0.5 ? 1 : -1;

        // Movement: Kite - maintain optimal range
        let moveX = 0;
        let moveY = 0;

        if (distToPlayer > this.optimalRange) {
            // Approach
            moveX = (dx / distToPlayer) * speed;
            moveY = (dy / distToPlayer) * speed;
        } else {
            // Retreat
            moveX = (-dx / distToPlayer) * speed * 1.2;
            moveY = (-dy / distToPlayer) * speed * 1.2;
        }

        // Add orbital strafing
        moveX += (-dy / distToPlayer) * speed * 0.8 * orbitDir;
        moveY += (dx / distToPlayer) * speed * 0.8 * orbitDir;

        // Stop when charging or firing
        if (this.isFiring || this.isCharging) {
            this.vel.x = 0;
            this.vel.y = 0;
        } else {
            this.vel.x = moveX;
            this.vel.y = moveY;
        }

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Charged beam attack logic
        const cooldown = this.definition.attackCooldown;

        if (!this.isCharging && !this.isFiring &&
            (time - this.lastShotTime > cooldown) &&
            distToPlayer < 850) {
            // Start charging
            this.isCharging = true;
            this.chargeProgress = 0;
            this.angle = Math.atan2(dy, dx);
        }

        if (this.isCharging) {
            // Track player during first half of charge
            if (this.chargeProgress < 0.5) {
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - this.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                this.angle += angleDiff * 0.1;
            }

            this.chargeProgress += dt * 0.5;

            if (this.chargeProgress >= 1.0) {
                this.isCharging = false;
                this.isFiring = true;
                this.chargeProgress = 0;
                this.lastShotTime = time;
            }
        }

        if (this.isFiring) {
            this.chargeProgress += dt * 0.8;

            if (this.chargeProgress >= 1.0) {
                this.isFiring = false;
                this.chargeProgress = 0;
            }
        }

        return result;
    }
}
