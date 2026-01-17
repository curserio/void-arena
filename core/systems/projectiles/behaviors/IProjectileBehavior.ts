/**
 * Projectile Behavior Interface
 * Strategy pattern for projectile update logic
 */

import { Vector2D, Entity } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';

// ============================================================================
// Context passed to behaviors each frame
// ============================================================================

export interface ProjectileBehaviorContext {
    dt: number;
    time: number;
    playerPos: Vector2D;
    targets: Entity[];
    aimDir: Vector2D;
    autoAttack: boolean;
    playerStats: {
        laserDuration: number;
    };
    enemyTimeScale?: number;
}

// ============================================================================
// Explosion data returned when projectile dies
// ============================================================================

export interface ExplosionData {
    pos: Vector2D;
    radius: number;
    color: string;
}

// ============================================================================
// Behavior Interface
// ============================================================================

export interface IProjectileBehavior {
    /**
     * Called each frame to update projectile-specific logic
     * The base movement is already handled by BaseProjectile.update()
     * This handles weapon-specific behaviors (homing, laser charging, etc.)
     */
    update(projectile: BaseProjectile, ctx: ProjectileBehaviorContext): void;

    /**
     * Called when projectile dies to determine if explosion should occur
     * @returns ExplosionData if explosion should spawn, null otherwise
     */
    onDeath(projectile: BaseProjectile): ExplosionData | null;
}
