/**
 * BaseBoss
 * Abstract base class for boss enemies with phase logic
 */

import { BaseEnemy } from '../BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition, BossPhase } from '../../../../types/enemies';

export abstract class BaseBoss extends BaseEnemy {
    protected readonly phases: BossPhase[];
    protected currentPhaseIndex: number = 0;

    // Boss-specific cooldowns
    public lastMissileTime: number = 0;
    public lastSpawnTime: number = 0;

    constructor(
        id: string,
        pos: Vector2D,
        definition: EnemyDefinition,
        finalHealth: number,
        finalRadius: number,
        shield: number,
        color: string,
        level: number
    ) {
        super(
            id,
            pos,
            definition,
            EnemyTier.NORMAL, // Bosses don't use tier system
            finalHealth,
            finalRadius,
            shield,
            color,
            level
        );

        // Override boss flag
        (this as any).isBoss = true;

        this.phases = definition.phases ?? [];
    }

    /**
     * Check and update current phase based on health
     */
    protected updatePhase(): void {
        const healthPercent = (this.health / this.maxHealth) * 100;

        for (let i = this.phases.length - 1; i >= 0; i--) {
            if (healthPercent <= this.phases[i].healthPercent) {
                if (this.currentPhaseIndex !== i) {
                    this.currentPhaseIndex = i;
                    this.onPhaseChange(i);
                }
                break;
            }
        }
    }

    /**
     * Called when boss enters a new phase
     */
    protected onPhaseChange(phaseIndex: number): void {
        // Override in subclasses for phase-specific behavior
    }

    /**
     * Check if current phase has a specific ability
     */
    protected hasAbility(ability: string): boolean {
        if (this.currentPhaseIndex >= this.phases.length) return false;
        return this.phases[this.currentPhaseIndex].abilities.includes(ability);
    }
}
