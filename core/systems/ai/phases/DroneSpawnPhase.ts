/**
 * Drone Spawn Phase
 * Boss ability: Spawn kamikaze drones
 * Used by: Destroyer
 */

import { EnemyUpdateResult } from '../../../../types/entities';
import { EnemyType } from '../../../../types/enemies';
import { AIContext } from '../AIContext';
import { BaseBoss } from '../../../entities/enemies/bosses/BaseBoss';
import { IBossPhase } from './IBossPhase';

export interface DroneSpawnConfig {
    cooldown: number;       // Time between spawns (ms)
    minDrones: number;      // Minimum drones per spawn
    maxDrones: number;      // Maximum drones per spawn
    ejectSpeed: number;     // Speed at which drones are ejected
    droneType: EnemyType;   // Type of enemy to spawn
}

export class DroneSpawnPhase implements IBossPhase {
    readonly name = 'DroneSpawn';
    private readonly config: DroneSpawnConfig;

    constructor(config: Partial<DroneSpawnConfig> = {}) {
        this.config = {
            cooldown: config.cooldown ?? 8000,
            minDrones: config.minDrones ?? 2,
            maxDrones: config.maxDrones ?? 4,
            ejectSpeed: config.ejectSpeed ?? 300,
            droneType: config.droneType ?? EnemyType.KAMIKAZE,
        };
    }

    shouldExecute(ctx: AIContext, boss: BaseBoss): boolean {
        const { time } = ctx;
        return time - boss.lastSpawnTime > this.config.cooldown;
    }

    execute(ctx: AIContext, boss: BaseBoss): EnemyUpdateResult {
        const result: EnemyUpdateResult = { bulletsToSpawn: [], enemiesToSpawn: [] };
        const { time } = ctx;

        boss.lastSpawnTime = time;

        const droneCount = this.config.minDrones +
            Math.floor(Math.random() * (this.config.maxDrones - this.config.minDrones + 1));

        for (let i = 0; i < droneCount; i++) {
            const ejectAngle = boss.angle + Math.PI + (Math.random() - 0.5);

            result.enemiesToSpawn.push({
                type: this.config.droneType,
                pos: {
                    x: boss.pos.x + (Math.random() - 0.5) * 50,
                    y: boss.pos.y + (Math.random() - 0.5) * 50
                },
                vel: {
                    x: Math.cos(ejectAngle) * this.config.ejectSpeed,
                    y: Math.sin(ejectAngle) * this.config.ejectSpeed,
                },
                difficultyMult: Math.max(0.5, boss.level * 0.2),
                level: boss.level,  // Inherit boss level
            });
        }

        return result;
    }
}
