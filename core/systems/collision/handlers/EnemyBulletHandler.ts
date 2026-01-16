/**
 * Enemy Bullet Handler
 * Handles enemy projectiles hitting player
 */

import { EntityType, WeaponType } from '../../../../types';
import { ICollisionHandler } from './ICollisionHandler';
import { CollisionContext } from '../CollisionContext';

export class EnemyBulletHandler implements ICollisionHandler {
    private readonly PLAYER_RADIUS = 20;

    handle(ctx: CollisionContext): void {
        const { projectiles, playerPos, callbacks, time } = ctx;

        for (const p of projectiles) {
            if (!p.isAlive) continue;
            if (p.type !== EntityType.ENEMY_BULLET) continue;

            const dist = Math.hypot(p.pos.x - playerPos.x, p.pos.y - playerPos.y);

            if (dist < this.PLAYER_RADIUS + p.radius) {
                // Damage with multiplicative level scaling
                const baseDmg = p.damage ?? 10;
                const dmg = baseDmg * (1 + (p.level || 1) * 0.05);

                callbacks.triggerPlayerHit(time, dmg, p as any);

                // Homing missile explosion VFX
                if ((p as any).weaponType === WeaponType.MISSILE) {
                    callbacks.spawnExplosion(p.pos, 80, '#f97316');
                }

                p.isAlive = false;
                p.health = 0;
            }
        }
    }
}

export const enemyBulletHandler = new EnemyBulletHandler();
