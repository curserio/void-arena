/**
 * Attack Behavior Interface
 * Defines contract for enemy attack strategies
 */

import { AIContext } from '../AIContext';
import { IProjectileSpawn } from '../../../../types/entities';

export interface IAttackBehavior {
    /**
     * Check if attack should trigger this frame
     */
    shouldAttack(ctx: AIContext): boolean;

    /**
     * Execute the attack and return projectiles to spawn
     */
    execute(ctx: AIContext): IProjectileSpawn[];
}
