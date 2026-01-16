/**
 * Projectile Attack Behavior
 * Fires projectiles at the player when in range
 * Used by: Scout, LaserScout (simplified), Strikers (burst)
 */

import { AIContext } from '../AIContext';
import { IAttackBehavior } from './IAttackBehavior';
import { IProjectileSpawn } from '../../../../types/entities';

export interface ProjectileAttackConfig {
    cooldown: number;            // Base cooldown in ms
    cooldownVariance: number;    // Random variance per enemy
    range: number;               // Maximum attack range
    projectileSpeed: number;     // Projectile speed
    projectileRadius: number;    // Projectile size
    projectileColor: string;     // Projectile color
    baseDamage: number;          // Base damage before multipliers
    aimSpread: number;           // Random aim spread in radians
}

export class ProjectileAttack implements IAttackBehavior {
    private readonly config: ProjectileAttackConfig;

    constructor(config: Partial<ProjectileAttackConfig> = {}) {
        this.config = {
            cooldown: config.cooldown ?? 1500,
            cooldownVariance: config.cooldownVariance ?? 500,
            range: config.range ?? 600,
            projectileSpeed: config.projectileSpeed ?? 320,
            projectileRadius: config.projectileRadius ?? 7,
            projectileColor: config.projectileColor ?? '#f97316',
            baseDamage: config.baseDamage ?? 10,
            aimSpread: config.aimSpread ?? 0.25,
        };
    }

    shouldAttack(ctx: AIContext): boolean {
        const { enemy, playerPos, time } = ctx;

        // Check range
        const dx = playerPos.x - enemy.pos.x;
        const dy = playerPos.y - enemy.pos.y;
        const dist = Math.hypot(dx, dy);

        if (dist > this.config.range) {
            return false;
        }

        // Check cooldown (using enemy's aiSeed for variance)
        const cooldown = this.config.cooldown + enemy.aiSeed * this.config.cooldownVariance;
        return time - enemy.lastShotTime > cooldown;
    }

    execute(ctx: AIContext): IProjectileSpawn[] {
        const { enemy, playerPos, time } = ctx;

        // Update last shot time
        enemy.lastShotTime = time;

        // Calculate aim direction
        const dx = playerPos.x - enemy.pos.x;
        const dy = playerPos.y - enemy.pos.y;
        const aimAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * this.config.aimSpread;

        // Get projectile properties (modified by tier)
        let radius = this.config.projectileRadius;
        let color = this.config.projectileColor;
        let speed = this.config.projectileSpeed;

        if (enemy.isMiniboss) {
            radius = 14;
            color = '#ef4444';
            speed = 400;
        } else if (enemy.isLegendary) {
            radius = 12;
            color = '#fbbf24';
            speed = 380;
        } else if (enemy.isElite) {
            radius = 9;
            color = '#d946ef';
            speed = 350;
        }

        return [{
            pos: { x: enemy.pos.x, y: enemy.pos.y },
            vel: {
                x: Math.cos(aimAngle) * speed,
                y: Math.sin(aimAngle) * speed,
            },
            radius,
            color,
            damage: this.config.baseDamage * enemy.damageMult,
            level: enemy.level,
            isElite: enemy.isElite,
            isLegendary: enemy.isLegendary,
        }];
    }
}
