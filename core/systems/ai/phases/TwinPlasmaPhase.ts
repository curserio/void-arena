/**
 * Twin Plasma Phase
 * Boss attack: Fire twin plasma bolts from side cannons
 * Used by: Destroyer
 */

import { EnemyUpdateResult, IProjectileSpawn } from '../../../../types/entities';
import { AIContext } from '../AIContext';
import { BaseBoss } from '../../../entities/enemies/bosses/BaseBoss';
import { IBossPhase } from './IBossPhase';
import { EnemyTier } from '../../../../types/enemies';

export interface TwinPlasmaConfig {
    cooldown: number;         // Time between shots (ms)
    projectileSpeed: number;  // Projectile speed
    projectileRadius: number; // Projectile size
    baseDamage: number;       // Base damage
    cannonOffset: number;     // Distance from center to cannons
}

export class TwinPlasmaPhase implements IBossPhase {
    readonly name = 'TwinPlasma';
    private readonly config: TwinPlasmaConfig;

    constructor(config: Partial<TwinPlasmaConfig> = {}) {
        this.config = {
            cooldown: config.cooldown ?? 1200,
            projectileSpeed: config.projectileSpeed ?? 480,
            projectileRadius: config.projectileRadius ?? 12,
            baseDamage: config.baseDamage ?? 15,
            cannonOffset: config.cannonOffset ?? 25,
        };
    }

    shouldExecute(ctx: AIContext, boss: BaseBoss): boolean {
        const { time } = ctx;
        return time - boss.lastShotTime > this.config.cooldown;
    }

    execute(ctx: AIContext, boss: BaseBoss): EnemyUpdateResult {
        const result: EnemyUpdateResult = { bulletsToSpawn: [], enemiesToSpawn: [] };
        const { time } = ctx;

        boss.lastShotTime = time;

        const aim = boss.angle;
        const offset = this.config.cannonOffset;

        // Tier-based plasma color
        const plasmaColor = boss.tier === EnemyTier.NORMAL ? '#f43f5e' : boss.color;
        const damage = this.config.baseDamage * boss.damageMult;

        // Left cannon
        result.bulletsToSpawn.push({
            pos: {
                x: boss.pos.x + Math.cos(aim + Math.PI / 2) * offset,
                y: boss.pos.y + Math.sin(aim + Math.PI / 2) * offset
            },
            vel: {
                x: Math.cos(aim) * this.config.projectileSpeed,
                y: Math.sin(aim) * this.config.projectileSpeed
            },
            radius: this.config.projectileRadius,
            color: plasmaColor,
            damage,
            isElite: true,
            level: boss.level,
        });

        // Right cannon
        result.bulletsToSpawn.push({
            pos: {
                x: boss.pos.x + Math.cos(aim - Math.PI / 2) * offset,
                y: boss.pos.y + Math.sin(aim - Math.PI / 2) * offset
            },
            vel: {
                x: Math.cos(aim) * this.config.projectileSpeed,
                y: Math.sin(aim) * this.config.projectileSpeed
            },
            radius: this.config.projectileRadius,
            color: plasmaColor,
            damage,
            isElite: true,
            level: boss.level,
        });

        return result;
    }
}
