/**
 * Input Manager
 * Centralized input state management
 * Provides a single point of access for movement, aim, and fire inputs
 */

import { Vector2D } from '../../../types';
import { InputState, createDefaultInputState } from './InputState';

/**
 * Singleton class managing all input state
 */
export class InputManager {
    private state: InputState;

    constructor() {
        this.state = createDefaultInputState();
    }

    // ========================================================================
    // Getters
    // ========================================================================

    /**
     * Get current movement direction (normalized -1 to 1)
     */
    getMovement(): Vector2D {
        return this.state.movement;
    }

    /**
     * Get current aim direction (normalized)
     */
    getAim(): Vector2D {
        return this.state.aim;
    }

    /**
     * Check if fire trigger is pressed
     */
    isFiring(): boolean {
        return this.state.fire;
    }

    /**
     * Get full input state (for passing to systems)
     */
    getState(): Readonly<InputState> {
        return this.state;
    }

    // ========================================================================
    // Setters (called by input sources: Joystick, keyboard, etc.)
    // ========================================================================

    /**
     * Set movement direction
     */
    setMovement(dir: Vector2D): void {
        this.state.movement = { ...dir };
    }

    /**
     * Set aim direction
     */
    setAim(dir: Vector2D): void {
        this.state.aim = { ...dir };
    }

    /**
     * Set fire trigger state
     */
    setFire(pressed: boolean): void {
        this.state.fire = pressed;
    }

    // ========================================================================
    // Utilities
    // ========================================================================

    /**
     * Reset all inputs to default state
     */
    reset(): void {
        this.state = createDefaultInputState();
    }

    /**
     * Reset movement only
     */
    resetMovement(): void {
        this.state.movement = { x: 0, y: 0 };
    }

    /**
     * Reset aim only
     */
    resetAim(): void {
        this.state.aim = { x: 0, y: 0 };
    }
}

// Singleton instance
export const inputManager = new InputManager();
