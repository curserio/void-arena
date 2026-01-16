/**
 * Laser Attack Behavior
 * Charge-up beam attack with tracking during charge phase
 * Used by: LaserScout
 */

import { AIContext } from '../AIContext';
import { IAttackBehavior } from './IAttackBehavior';
import { IProjectileSpawn } from '../../../../types/entities';

export interface LaserAttackConfig {
    cooldown: number;        // Time between attacks
    chargeTime: number;      // Time to charge (in seconds)
    fireTime: number;        // Time firing (in seconds)
    range: number;           // Maximum attack range
    trackingFactor: number;  // How much to track during charge (0-1)
}

export interface LaserState {
    isCharging: boolean;
    isFiring: boolean;
    chargeProgress: number;
    angle: number;
}

export class LaserAttack implements IAttackBehavior {
    private readonly config: LaserAttackConfig;

    constructor(config: Partial<LaserAttackConfig> = {}) {
        this.config = {
            cooldown: config.cooldown ?? 3000,
            chargeTime: config.chargeTime ?? 2.0,
            fireTime: config.fireTime ?? 1.25,
            range: config.range ?? 850,
            trackingFactor: config.trackingFactor ?? 0.1,
        };
    }

    shouldAttack(ctx: AIContext): boolean {
        const { enemy, playerPos, time } = ctx;

        // Check if already attacking
        if (enemy.isCharging || enemy.isFiring) {
            return false;
        }

        // Check range
        const dx = playerPos.x - enemy.pos.x;
        const dy = playerPos.y - enemy.pos.y;
        const dist = Math.hypot(dx, dy);

        if (dist > this.config.range) {
            return false;
        }

        // Check cooldown
        return time - enemy.lastShotTime > this.config.cooldown;
    }

    /**
     * Start charging - sets enemy state
     */
    startCharge(ctx: AIContext): void {
        const { enemy, playerPos } = ctx;

        const dx = playerPos.x - enemy.pos.x;
        const dy = playerPos.y - enemy.pos.y;

        enemy.isCharging = true;
        enemy.chargeProgress = 0;
        enemy.angle = Math.atan2(dy, dx);
    }

    /**
     * Update charging/firing state
     * Returns true if currently attacking (charging or firing)
     */
    updateState(ctx: AIContext): void {
        const { enemy, playerPos, dt, time } = ctx;

        if (enemy.isCharging) {
            // Track player during first half of charge
            if (enemy.chargeProgress < 0.5) {
                const dx = playerPos.x - enemy.pos.x;
                const dy = playerPos.y - enemy.pos.y;
                const targetAngle = Math.atan2(dy, dx);

                let angleDiff = targetAngle - enemy.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                enemy.angle += angleDiff * this.config.trackingFactor;
            }

            enemy.chargeProgress += dt / this.config.chargeTime;

            if (enemy.chargeProgress >= 1.0) {
                enemy.isCharging = false;
                enemy.isFiring = true;
                enemy.chargeProgress = 0;
                enemy.lastShotTime = time;
            }
        }

        if (enemy.isFiring) {
            enemy.chargeProgress += dt / this.config.fireTime;

            if (enemy.chargeProgress >= 1.0) {
                enemy.isFiring = false;
                enemy.chargeProgress = 0;
            }
        }
    }

    /**
     * LaserAttack doesn't spawn projectiles - the laser is rendered directly
     * based on enemy.angle and enemy.isFiring state
     */
    execute(_ctx: AIContext): IProjectileSpawn[] {
        // Laser damage is handled by EnemyLaserHandler in collision system
        return [];
    }
}
