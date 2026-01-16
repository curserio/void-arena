/**
 * Standard Projectile Behavior
 * Default behavior for linear projectiles (plasma, bullets)
 * No special update logic - BaseProjectile handles movement
 */

import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { IProjectileBehavior, ProjectileBehaviorContext, ExplosionData } from './IProjectileBehavior';
import { WeaponEffect } from '../../../../types/projectiles';

export class StandardBehavior implements IProjectileBehavior {
    update(_projectile: BaseProjectile, _ctx: ProjectileBehaviorContext): void {
        // No special logic - BaseProjectile.update() handles linear movement
    }

    onDeath(projectile: BaseProjectile): ExplosionData | null {
        // Explosive projectiles spawn explosion on death
        if (projectile.weaponEffect === WeaponEffect.EXPLOSIVE) {
            return {
                pos: { ...projectile.pos },
                radius: projectile.type === 'PLAYER_BULLET' ? 150 : 80,
                color: projectile.color,
            };
        }
        return null;
    }
}

// Singleton instance
export const standardBehavior = new StandardBehavior();
