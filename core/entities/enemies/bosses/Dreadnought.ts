/**
 * Dreadnought Boss
 * Standard boss with charged beam attack
 */

import { BaseBoss } from './BaseBoss';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../../types/entities';
import { EnemyType, EnemyTier, IEnemy, EnemyDefinition } from '../../../../types/enemies';
import { getEnemyDefinition } from '../../../../data/enemies/definitions';

export class Dreadnought extends BaseBoss {
    readonly enemyType = EnemyType.BOSS_DREADNOUGHT;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;

    constructor(
        id: string,
        pos: Vector2D,
        finalHealth: number,
        finalRadius: number,
        shield: number,
        color: string,
        level: number,
        initialTime: number,
        damageMult: number
    ) {
        const definition = getEnemyDefinition(EnemyType.BOSS_DREADNOUGHT);
        super(id, pos, definition, finalHealth, finalRadius, shield, color, level, damageMult);

        this.definition = definition;
        this.baseSpeed = definition.baseSpeed;

        // Initialize cooldowns
        this.lastShotTime = initialTime + 2000;
    }

    update(context: UpdateContext): EnemyUpdateResult {
        const result = this.emptyResult();
        const { dt, time, playerPos } = context;

        // Update phase based on health
        this.updatePhase();

        const speedMult = this.getSpeedMultiplier(time);
        const speed = this.baseSpeed * speedMult;

        const dx = playerPos.x - this.pos.x;
        const dy = playerPos.y - this.pos.y;
        const distToPlayer = Math.hypot(dx, dy);

        // Movement: Chase until 400 range, then slow down
        if (distToPlayer > 400 && !this.isFiring) {
            this.vel.x = (dx / distToPlayer) * speed;
            this.vel.y = (dy / distToPlayer) * speed;
        } else {
            this.vel.x *= 0.95;
            this.vel.y *= 0.95;
        }

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Rotation towards player with constant speed
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const turnRate = 0.3;
        const maxTurn = turnRate * dt;

        if (Math.abs(angleDiff) > maxTurn) {
            this.angle += Math.sign(angleDiff) * maxTurn;
        } else {
            this.angle += angleDiff;
        }

        // Charged beam attack
        const attackCooldown = this.definition.attackCooldown;

        if (!this.isCharging && !this.isFiring && (time - this.lastShotTime > attackCooldown)) {
            this.isCharging = true;
            this.chargeProgress = 0;
        }

        if (this.isCharging) {
            this.chargeProgress += dt * 0.4;

            if (this.chargeProgress >= 1.0) {
                this.isCharging = false;
                this.isFiring = true;
                this.chargeProgress = 0;
                this.lastShotTime = time;
            }
        }

        if (this.isFiring) {
            this.chargeProgress += dt * 0.25;

            if (this.chargeProgress >= 1.0) {
                this.isFiring = false;
                this.chargeProgress = 0;
            }
        }

        return result;
    }
}
