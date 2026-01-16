/**
 * Player Body Handler
 * Handles player body colliding with enemies (Striker melee, Kamikaze trigger)
 */

import { EnemyType } from '../../../../types/enemies';
import { ICollisionHandler } from './ICollisionHandler';
import { CollisionContext } from '../CollisionContext';
import { getEnemyDefinition } from '../../../../data/enemies/definitions';

export class PlayerBodyHandler implements ICollisionHandler {
    private readonly PLAYER_RADIUS = 20;

    handle(ctx: CollisionContext): void {
        const { playerPos, grid, callbacks, time } = ctx;

        const candidates = grid.retrieve(playerPos);

        for (const e of candidates) {
            const dist = Math.hypot(e.pos.x - playerPos.x, e.pos.y - playerPos.y);

            if (dist < this.PLAYER_RADIUS + e.radius) {
                // Kamikaze: Explode on contact (Death handler processes blast)
                if (e.enemyType === EnemyType.KAMIKAZE) {
                    e.health = 0;
                    continue;
                }

                let collisionDmg = 15; // Base collision damage

                // Strikers scale melee damage with tier
                if (e.enemyType === EnemyType.STRIKER) {
                    const baseDmg = getEnemyDefinition(e.enemyType).attacks?.collision ?? 15;
                    collisionDmg = baseDmg * e.damageMult * (1 + (e.level || 1) * 0.05);
                }

                // Boss mass multiplier
                const isBoss = e.enemyType === EnemyType.BOSS_DREADNOUGHT ||
                    e.enemyType === EnemyType.BOSS_DESTROYER;
                if (isBoss) collisionDmg *= 1.5;

                callbacks.triggerPlayerHit(time, collisionDmg, e as any);
            }
        }
    }
}

export const playerBodyHandler = new PlayerBodyHandler();
