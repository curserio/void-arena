/**
 * WaveManager
 * Pure logic class for wave timing and spawn decisions
 * No React hooks, no side effects - just calculations
 */

import { EnemyType } from '../../types/enemies';
import { DifficultyConfig } from '../../types/game';
import { WaveConfig, DEFAULT_WAVE_CONFIG } from '../../data/spawning/waveConfig';

// ============================================================================
// Interfaces
// ============================================================================

export interface WaveState {
    currentWave: number;        // Which wave cycle we're in
    timeInCycle: number;        // Time within current cycle
    isLull: boolean;            // In rest period
    isRushHour: boolean;        // Last 15s of wave
    spawnDelay: number;         // Current spawn delay
}

export type SpawnType = 'enemy' | 'boss' | 'kamikaze_wave' | 'lull_enemy' | 'none';

export interface SpawnDecision {
    shouldSpawn: boolean;
    type: SpawnType;
    enemyType?: EnemyType;
    bossType?: EnemyType;
    count?: number;             // For kamikaze waves
    isEliteWave?: boolean;      // For kamikaze elite waves
    waveIndex?: number;         // For boss tier calculation
}

// ============================================================================
// WaveManager Class
// ============================================================================

export class WaveManager {
    private readonly config: WaveConfig;
    private readonly difficulty: DifficultyConfig;

    // State tracking (values persisted between calls)
    private lastBossWave: number = 0;
    private lastKamikazeTime: number = 0;

    constructor(config: WaveConfig = DEFAULT_WAVE_CONFIG, difficulty: DifficultyConfig) {
        this.config = config;
        this.difficulty = difficulty;
    }

    /**
     * Reset state for new game
     */
    reset(): void {
        this.lastBossWave = 0;
        this.lastKamikazeTime = 0;
    }

    /**
     * Get current wave state without side effects
     */
    getWaveState(gameTime: number): WaveState {
        const { waveDuration, lullDuration, rushHourDuration } = this.config;
        const cycleTime = waveDuration + lullDuration;

        const currentWave = Math.floor(gameTime / cycleTime);
        const timeInCycle = gameTime % cycleTime;
        const isLull = timeInCycle > waveDuration;
        const isRushHour = !isLull && timeInCycle > (waveDuration - rushHourDuration);

        const spawnDelay = this.calculateSpawnDelay(gameTime, isRushHour);

        return {
            currentWave,
            timeInCycle,
            isLull,
            isRushHour,
            spawnDelay,
        };
    }

    /**
     * Get difficulty multiplier for enemy stats
     * Uses soft-cap formula with difficulty-based curve steepness
     * Higher difficulties scale faster over time
     */
    getDifficultyMultiplier(gameTime: number): number {
        const gameMinutes = gameTime / 60;

        // Base curve steepness varies by difficulty
        // Normal: 0.35, Hard: 0.45, Nightmare: 0.55, Hell: 0.65
        const curveSteepness = 0.35 + (this.difficulty.statMultiplier - 1) * 0.03;

        // Linear scaling - steeper on higher difficulties
        const linearPart = gameMinutes * curveSteepness;

        // Logarithmic soft-cap - higher difficulties get more log growth
        const logFactor = 3 + (this.difficulty.statMultiplier - 1) * 0.5;
        const logPart = Math.log10(1 + gameMinutes * 0.2) * logFactor;

        const timeMultiplier = 1 + linearPart + logPart;

        return timeMultiplier * this.difficulty.statMultiplier;
    }

    /**
     * Get credit multiplier based on game time
     * Credits scale to match increasing upgrade costs
     */
    getCreditMultiplier(gameTime: number): number {
        const gameMinutes = gameTime / 60;
        // Gradual credit scaling - keeps up with enemy HP scaling
        return 1 + (gameMinutes * 0.1) + Math.log10(1 + gameMinutes * 0.15);
    }

    /**
     * Determine what should spawn based on current game state
     * @param gameTime Current game time in seconds
     * @param spawnTimer Time since last spawn attempt
     * @param shielderCount Current number of shielders alive (for limit enforcement)
     * @param carrierCount Current number of carriers alive (for limit enforcement)
     * @returns SpawnDecision with what to spawn (or nothing)
     */
    getSpawnDecision(gameTime: number, spawnTimer: number, shielderCount: number = 0, carrierCount: number = 0): SpawnDecision {
        const waveState = this.getWaveState(gameTime);

        // Check for boss spawn first
        const bossDecision = this.checkBossSpawn(gameTime);
        if (bossDecision) return bossDecision;

        // In lull period
        if (waveState.isLull) {
            return this.getLullSpawnDecision(gameTime, spawnTimer);
        }

        // Check spawn timer
        if (spawnTimer < waveState.spawnDelay) {
            return { shouldSpawn: false, type: 'none' };
        }

        // Check for kamikaze wave
        const kamikazeDecision = this.checkKamikazeWave(gameTime);
        if (kamikazeDecision) return kamikazeDecision;

        // Normal enemy spawn (with shielder and carrier limits)
        return this.getNormalEnemyDecision(gameTime, shielderCount, carrierCount);
    }

    /**
     * Mark that a boss was spawned for the given wave
     */
    markBossSpawned(waveIndex: number): void {
        this.lastBossWave = waveIndex;
    }

    /**
     * Mark that a kamikaze wave was spawned
     */
    markKamikazeSpawned(gameTime: number): void {
        this.lastKamikazeTime = gameTime;
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    private calculateSpawnDelay(gameTime: number, isRushHour: boolean): number {
        const { base, min, decayPerSecond, rushMultiplier } = this.config.spawnRates;

        let delay = Math.max(min, base - (gameTime / decayPerSecond));

        if (isRushHour) {
            delay /= rushMultiplier;
        }

        // Apply difficulty scaling
        delay /= (1 + (this.difficulty.statMultiplier - 1) * 0.2);

        return delay;
    }

    private checkBossSpawn(gameTime: number): SpawnDecision | null {
        const { bossInterval, destroyerChance } = this.config;
        const currentBossWave = Math.floor(gameTime / bossInterval);

        if (currentBossWave > this.lastBossWave) {
            const isDestroyer = Math.random() < destroyerChance;
            return {
                shouldSpawn: true,
                type: 'boss',
                bossType: isDestroyer ? EnemyType.BOSS_DESTROYER : EnemyType.BOSS_DREADNOUGHT,
                waveIndex: currentBossWave,
            };
        }

        return null;
    }

    private checkKamikazeWave(gameTime: number): SpawnDecision | null {
        const {
            kamikazeThreshold,
            kamikazeUnlockTime,
            kamikazeCooldown,
            kamikazeMinCount,
            kamikazeMaxCount,
            eliteWaveChance,
        } = this.config.enemyTypeRolls;

        const roll = Math.random();

        if (gameTime > kamikazeUnlockTime &&
            roll > kamikazeThreshold &&
            (gameTime - this.lastKamikazeTime) > kamikazeCooldown) {

            const count = kamikazeMinCount + Math.floor(Math.random() * (kamikazeMaxCount - kamikazeMinCount + 1));
            const isEliteWave = Math.random() < eliteWaveChance;

            return {
                shouldSpawn: true,
                type: 'kamikaze_wave',
                enemyType: EnemyType.KAMIKAZE,
                count: isEliteWave ? 1 : count,  // Elite waves spawn single elite
                isEliteWave,
            };
        }

        return null;
    }

    private getNormalEnemyDecision(gameTime: number, shielderCount: number = 0, carrierCount: number = 0): SpawnDecision {
        const {
            laserScoutThreshold, laserScoutUnlockTime,
            strikerThreshold,
            shielderThreshold, shielderUnlockTime,
            carrierThreshold, carrierUnlockTime
        } = this.config.enemyTypeRolls;
        const roll = Math.random();

        let enemyType = EnemyType.SCOUT;

        // Max 2 shielders at a time to prevent shield spam
        const MAX_SHIELDERS = 2;
        const canSpawnShielder = shielderCount < MAX_SHIELDERS && gameTime > shielderUnlockTime;

        // Max 3 carriers at a time
        const MAX_CARRIERS = 3;
        const canSpawnCarrier = carrierCount < MAX_CARRIERS && gameTime > carrierUnlockTime;

        if (roll > laserScoutThreshold && gameTime > laserScoutUnlockTime) {
            enemyType = EnemyType.LASER_SCOUT;
        } else if (roll > shielderThreshold && canSpawnShielder) {
            // Shielder: spawns after 3 min, ~5% chance (0.80-0.85 threshold gap), max 2
            enemyType = EnemyType.SHIELDER;
        } else if (roll > carrierThreshold && canSpawnCarrier) {
            // Carrier: spawns after 5 min, ~2% chance (0.78-0.80 threshold gap), max 3
            enemyType = EnemyType.CARRIER;
        } else if (roll > strikerThreshold) {
            enemyType = EnemyType.STRIKER;
        }

        return {
            shouldSpawn: true,
            type: 'enemy',
            enemyType,
        };
    }

    private getLullSpawnDecision(gameTime: number, spawnTimer: number): SpawnDecision {
        const { lullSpawnDelay, lullSpawnChance } = this.config;

        if (spawnTimer > lullSpawnDelay && Math.random() < lullSpawnChance) {
            return {
                shouldSpawn: true,
                type: 'lull_enemy',
                enemyType: EnemyType.SCOUT,
            };
        }

        return { shouldSpawn: false, type: 'none' };
    }
}
