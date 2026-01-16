/**
 * Movement Behavior Interface
 * Defines contract for enemy movement strategies
 */

import { Vector2D } from '../../../../types';
import { AIContext } from '../AIContext';

export interface IMovementBehavior {
    /**
     * Calculate the desired velocity for this frame
     */
    calculateVelocity(ctx: AIContext): Vector2D;
}
