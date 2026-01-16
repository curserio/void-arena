/**
 * Render Utilities
 * Performance utilities for canvas rendering
 */

import { Vector2D } from '../../types';

/**
 * Convert to integer for faster canvas rendering (avoids sub-pixel anti-aliasing)
 */
export const toInt = (n: number): number => n | 0;

/**
 * Check if position is within visible viewport
 * Returns true if entity should be rendered
 * 
 * @param zoom - Current zoom level (smaller = more visible area)
 */
export const isInViewport = (
    pos: Vector2D,
    cameraX: number,
    cameraY: number,
    screenWidth: number,
    screenHeight: number,
    margin: number = 100,
    zoom: number = 1.0
): boolean => {
    // When zoomed out, visible area is larger
    // zoom = 0.5 means we see 2x more area
    const effectiveWidth = screenWidth / zoom;
    const effectiveHeight = screenHeight / zoom;

    const left = cameraX - effectiveWidth / 2 - margin;
    const right = cameraX + effectiveWidth / 2 + margin;
    const top = cameraY - effectiveHeight / 2 - margin;
    const bottom = cameraY + effectiveHeight / 2 + margin;

    return pos.x >= left && pos.x <= right && pos.y >= top && pos.y <= bottom;
};

/**
 * Transform world position to screen position with integer rounding
 */
export const worldToScreen = (
    worldX: number,
    worldY: number,
    cameraX: number,
    cameraY: number,
    screenCenterX: number,
    screenCenterY: number
): { x: number; y: number } => ({
    x: (worldX - cameraX + screenCenterX) | 0,
    y: (worldY - cameraY + screenCenterY) | 0,
});
