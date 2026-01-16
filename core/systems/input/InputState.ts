/**
 * Input State Types
 * Defines the structure of input state
 */

import { Vector2D } from '../../../types';

/**
 * Complete input state at any given moment
 */
export interface InputState {
    /** Movement direction, normalized -1 to 1 */
    movement: Vector2D;

    /** Aim direction, normalized */
    aim: Vector2D;

    /** Fire trigger pressed */
    fire: boolean;
}

/**
 * Create default input state
 */
export function createDefaultInputState(): InputState {
    return {
        movement: { x: 0, y: 0 },
        aim: { x: 0, y: 0 },
        fire: false,
    };
}
