/**
 * IProjectileEffect
 * 
 * Strategy interface for special projectile logic (Pulsing, Chain, etc.)
 * Decouples logic from the main PlayerBulletHandler.
 */

import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { CollisionContext } from '../../collision/CollisionContext';
import { IEnemy } from '../../../../types/enemies';

export interface IProjectileEffect {
    /**
     * Called every frame/update tick
     */
    update(p: BaseProjectile, ctx: CollisionContext): void;

    /**
     * Called when the projectile hits an enemy
     * Return true if the hit event was "handled" and we should stop processing default hit logic?
     * Or just void to perform side effects?
     */
    onHit(p: BaseProjectile, target: IEnemy, ctx: CollisionContext): void;
}
