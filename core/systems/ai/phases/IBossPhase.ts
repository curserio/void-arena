/**
 * Boss Phase Interface
 * Defines contract for boss attack/behavior phases
 */

import { EnemyUpdateResult } from '../../../../types/entities';
import { AIContext } from '../AIContext';
import { BaseBoss } from '../../../entities/enemies/bosses/BaseBoss';

export interface IBossPhase {
    /** Phase identifier */
    readonly name: string;

    /**
     * Check if this phase should execute this frame
     */
    shouldExecute(ctx: AIContext, boss: BaseBoss): boolean;

    /**
     * Execute the phase behavior
     */
    execute(ctx: AIContext, boss: BaseBoss): EnemyUpdateResult;
}
