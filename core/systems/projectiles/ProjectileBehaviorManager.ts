/**
 * Projectile Behavior Manager
 * Registry and dispatcher for projectile behaviors
 */

import { BaseProjectile } from '../../entities/projectiles/BaseProjectile';
import { WeaponEffect } from '../../../types/projectiles';
import { EntityType } from '../../../types';
import {
    IProjectileBehavior,
    ProjectileBehaviorContext,
    ExplosionData
} from './behaviors/IProjectileBehavior';
import { standardBehavior } from './behaviors/StandardBehavior';
import { laserBehavior } from './behaviors/LaserBehavior';
import { homingBehavior } from './behaviors/HomingBehavior';

export class ProjectileBehaviorManager {
    private behaviors: Map<WeaponEffect, IProjectileBehavior>;

    constructor() {
        this.behaviors = new Map();

        // Register default behaviors
        this.behaviors.set(WeaponEffect.NONE, standardBehavior);
        this.behaviors.set(WeaponEffect.EXPLOSIVE, standardBehavior);
        this.behaviors.set(WeaponEffect.PIERCING, standardBehavior);
        this.behaviors.set(WeaponEffect.SPLIT, standardBehavior);
        this.behaviors.set(WeaponEffect.LASER, laserBehavior);
        this.behaviors.set(WeaponEffect.HOMING, homingBehavior);
    }

    /**
     * Get behavior for a weapon effect
     */
    getBehavior(effect: WeaponEffect): IProjectileBehavior {
        return this.behaviors.get(effect) || standardBehavior;
    }

    /**
     * Register a custom behavior
     */
    registerBehavior(effect: WeaponEffect, behavior: IProjectileBehavior): void {
        this.behaviors.set(effect, behavior);
    }

    /**
     * Update a single projectile using its behavior
     */
    updateProjectile(projectile: BaseProjectile, ctx: ProjectileBehaviorContext): void {
        const behavior = this.getBehavior(projectile.weaponEffect);
        behavior.update(projectile, ctx);
    }

    /**
     * Update all projectiles and collect explosions from deaths
     * Returns list of projectiles that are still alive and explosion data
     */
    updateAll(
        projectiles: BaseProjectile[],
        ctx: ProjectileBehaviorContext
    ): { alive: BaseProjectile[], explosions: ExplosionData[] } {
        const alive: BaseProjectile[] = [];
        const explosions: ExplosionData[] = [];

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];

            // Base update (movement, lifetime)
            // Apply Time Warp if applicable
            let stepDt = ctx.dt;
            if (p.type === EntityType.ENEMY_BULLET && ctx.enemyTimeScale !== undefined) {
                stepDt *= ctx.enemyTimeScale;
            }

            p.update(stepDt, ctx.time);

            // Behavior-specific update
            if (p.isAlive) {
                // Pass the SCALED dt to behavior context
                this.updateProjectile(p, { ...ctx, dt: stepDt });
            }

            // Check for death and collect explosions
            if (!p.isAlive) {
                const behavior = this.getBehavior(p.weaponEffect);
                const explosion = behavior.onDeath(p);
                if (explosion) {
                    explosions.push(explosion);
                }
            } else {
                alive.push(p);
            }
        }

        return { alive, explosions };
    }
}

// Singleton instance
export const projectileBehaviorManager = new ProjectileBehaviorManager();
