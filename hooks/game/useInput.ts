/**
 * useInput Hook
 * React hook providing access to InputManager
 */

import { useRef, useCallback } from 'react';
import { Vector2D } from '../../types';
import { inputManager } from '../../core/systems/input';

/**
 * Hook for accessing and updating input state
 */
export const useInput = () => {
    // Create refs that point to InputManager methods for stable references
    const movementRef = useRef(inputManager.getMovement());
    const aimRef = useRef(inputManager.getAim());
    const triggerRef = useRef(inputManager.isFiring());

    // Update movement (called by Joystick)
    const setMovement = useCallback((dir: Vector2D) => {
        inputManager.setMovement(dir);
        movementRef.current = dir;
    }, []);

    // Update aim (called by Joystick or tap-to-aim)
    const setAim = useCallback((dir: Vector2D) => {
        inputManager.setAim(dir);
        aimRef.current = dir;
    }, []);

    // Update trigger (called by fire button or auto-attack)
    const setFire = useCallback((pressed: boolean) => {
        inputManager.setFire(pressed);
        triggerRef.current = pressed;
    }, []);

    // Reset all inputs
    const reset = useCallback(() => {
        inputManager.reset();
        movementRef.current = { x: 0, y: 0 };
        aimRef.current = { x: 0, y: 0 };
        triggerRef.current = false;
    }, []);

    // Getters
    const getMovement = useCallback(() => inputManager.getMovement(), []);
    const getAim = useCallback(() => inputManager.getAim(), []);
    const isFiring = useCallback(() => inputManager.isFiring(), []);

    return {
        // Refs for direct access in game loop (no re-render)
        movementRef,
        aimRef,
        triggerRef,

        // Setters
        setMovement,
        setAim,
        setFire,
        reset,

        // Getters
        getMovement,
        getAim,
        isFiring,

        // Direct manager access
        inputManager,
    };
};
