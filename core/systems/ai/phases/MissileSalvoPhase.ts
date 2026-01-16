/**
 * Missile Salvo Phase
 * Boss attack: Fire a salvo of homing missiles
 * Used by: Destroyer
 */

import { EnemyUpdateResult } from '../../../../types/entities';
import { AIContext } from '../AIContext';
import { BaseBoss } from '../../../entities/enemies/bosses/BaseBoss';
import { IBossPhase } from './IBossPhase';

export interface MissileSalvoConfig {
    cooldown: number;       // Time between salvos (ms)
    minMissiles: number;    // Minimum missiles per salvo
    maxMissiles: number;    // Maximum missiles per salvo
    baseDamage: number;     // Base damage per missile
    missileSpeed: number;   // Initial missile speed
    turnRate: number;       // Homing turn rate
    duration: number;       // Missile lifetime (seconds)
}

export class MissileSalvoPhase implements IBossPhase {
    readonly name = 'MissileSalvo';
    private readonly config: MissileSalvoConfig;

    constructor(config: Partial<MissileSalvoConfig> = {}) {
        this.config = {
            cooldown: config.cooldown ?? 4000,
            minMissiles: config.minMissiles ?? 4,
            maxMissiles: config.maxMissiles ?? 6,
            baseDamage: config.baseDamage ?? 25,
            missileSpeed: config.missileSpeed ?? 200,
            turnRate: config.turnRate ?? 0.6,
            duration: config.duration ?? 4.0,
        };
    }

    shouldExecute(ctx: AIContext, boss: BaseBoss): boolean {
        const { time } = ctx;
        return time - boss.lastMissileTime > this.config.cooldown;
    }

    execute(ctx: AIContext, boss: BaseBoss): EnemyUpdateResult {
        const result: EnemyUpdateResult = { bulletsToSpawn: [], enemiesToSpawn: [] };
        const { time } = ctx;

        boss.lastMissileTime = time;

        const salvoCount = this.config.minMissiles +
            Math.floor(Math.random() * (this.config.maxMissiles - this.config.minMissiles + 1));
        const damage = this.config.baseDamage * boss.damageMult;

        for (let i = 0; i < salvoCount; i++) {
            const spread = (Math.random() - 0.5) * 1.5;
            const launchAngle = boss.angle + spread;

            result.bulletsToSpawn.push({
                pos: { x: boss.pos.x, y: boss.pos.y },
                vel: {
                    x: Math.cos(launchAngle) * this.config.missileSpeed,
                    y: Math.sin(launchAngle) * this.config.missileSpeed
                },
                radius: 10,
                color: '#f97316',
                damage,
                isHoming: true,
                turnRate: this.config.turnRate,
                maxDuration: this.config.duration,
                isElite: true,
                level: boss.level,
            });
        }

        return result;
    }
}
