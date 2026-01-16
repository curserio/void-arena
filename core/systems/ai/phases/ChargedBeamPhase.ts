/**
 * Charged Beam Phase
 * Boss attack: Charge up and fire a continuous laser beam
 * Used by: Dreadnought
 */

import { EnemyUpdateResult } from '../../../../types/entities';
import { AIContext } from '../AIContext';
import { BaseBoss } from '../../../entities/enemies/bosses/BaseBoss';
import { IBossPhase } from './IBossPhase';

export interface ChargedBeamConfig {
    cooldown: number;       // Time between attacks (ms)
    chargeSpeed: number;    // Charge rate (per second)
    fireSpeed: number;      // Fire duration rate (per second)
}

export class ChargedBeamPhase implements IBossPhase {
    readonly name = 'ChargedBeam';
    private readonly config: ChargedBeamConfig;

    constructor(config: Partial<ChargedBeamConfig> = {}) {
        this.config = {
            cooldown: config.cooldown ?? 3000,
            chargeSpeed: config.chargeSpeed ?? 0.4,
            fireSpeed: config.fireSpeed ?? 0.25,
        };
    }

    shouldExecute(ctx: AIContext, boss: BaseBoss): boolean {
        const { time } = ctx;

        // Already charging or firing
        if (boss.isCharging || boss.isFiring) {
            return true;
        }

        // Check cooldown
        return time - boss.lastShotTime > this.config.cooldown;
    }

    execute(ctx: AIContext, boss: BaseBoss): EnemyUpdateResult {
        const result: EnemyUpdateResult = { bulletsToSpawn: [], enemiesToSpawn: [] };
        const { dt, time } = ctx;

        // Start charging if not already
        if (!boss.isCharging && !boss.isFiring) {
            boss.isCharging = true;
            boss.chargeProgress = 0;
        }

        // Charging state
        if (boss.isCharging) {
            boss.chargeProgress += dt * this.config.chargeSpeed;

            if (boss.chargeProgress >= 1.0) {
                boss.isCharging = false;
                boss.isFiring = true;
                boss.chargeProgress = 0;
                boss.lastShotTime = time;
            }
        }

        // Firing state
        if (boss.isFiring) {
            boss.chargeProgress += dt * this.config.fireSpeed;

            if (boss.chargeProgress >= 1.0) {
                boss.isFiring = false;
                boss.chargeProgress = 0;
            }
        }

        return result;
    }
}
