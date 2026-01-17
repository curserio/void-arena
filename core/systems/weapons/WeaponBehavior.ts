/**
 * WeaponBehavior System
 * 
 * Defines interface for weapon firing behaviors and provides a registry
 * for looking up behaviors by weapon type.
 */

import { Vector2D, WeaponType, PlayerStats } from '../../../types';
import { BaseProjectile } from '../../entities/projectiles/BaseProjectile';

// ============================================================
// Fire Context - passed to weapon behaviors
// ============================================================

export interface FireContext {
    playerPos: Vector2D;
    fireAngle: number;
    stats: PlayerStats;
    time: number;
    isOmni: boolean;      // Omni-directional powerup
    isPierce: boolean;    // Pierce powerup
}

// ============================================================
// Weapon Behavior Interface
// ============================================================

export interface WeaponBehavior {
    weaponType: WeaponType;

    /**
     * Fire the weapon and return created projectiles
     */
    fire(ctx: FireContext): BaseProjectile[];

    /**
     * Optional: Called before fire to check if weapon can fire
     * (e.g., Laser checks for existing active laser)
     */
    canFire?(ctx: FireContext, existingProjectiles: BaseProjectile[]): boolean;

    /**
     * Optional: For burst weapons like Swarm Launcher
     * Returns true if this weapon uses burst mode
     */
    usesBurstMode?: boolean;
}

// ============================================================
// Weapon Behavior Registry
// ============================================================

const behaviorRegistry = new Map<WeaponType, WeaponBehavior>();

export function registerWeaponBehavior(behavior: WeaponBehavior): void {
    behaviorRegistry.set(behavior.weaponType, behavior);
}

export function getWeaponBehavior(weaponType: WeaponType): WeaponBehavior | undefined {
    return behaviorRegistry.get(weaponType);
}

export function hasWeaponBehavior(weaponType: WeaponType): boolean {
    return behaviorRegistry.has(weaponType);
}
