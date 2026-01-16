/**
 * Enemy Laser Handler
 * Handles LaserScout and Dreadnought beam collision with player
 */

import { EnemyType } from '../../../../types/enemies';
import { ICollisionHandler } from './ICollisionHandler';
import { CollisionContext } from '../CollisionContext';
import { distToSegmentSq } from '../CollisionHelpers';
import { getEnemyDefinition } from '../../../../data/enemies/definitions';

export class EnemyLaserHandler implements ICollisionHandler {
    private readonly PLAYER_RADIUS = 20;

    handle(ctx: CollisionContext): void {
        const { enemies, playerPos, callbacks, time } = ctx;

        for (const e of enemies) {
            const enemyType = e.enemyType;

            if ((enemyType !== EnemyType.LASER_SCOUT && enemyType !== EnemyType.BOSS_DREADNOUGHT)) {
                continue;
            }

            if (!e.isFiring) continue;

            const angle = e.angle || 0;
            const isBoss = enemyType === EnemyType.BOSS_DREADNOUGHT;

            // Beam properties
            const len = isBoss ? 1600 : 1200;
            const baseWidth = isBoss ? 90 : 40;
            const progress = e.chargeProgress || 0;
            const width = Math.max(20, baseWidth * (1 - progress * 0.3));

            const startX = e.pos.x;
            const startY = e.pos.y;
            const endX = startX + Math.cos(angle) * len;
            const endY = startY + Math.sin(angle) * len;

            const distSq = distToSegmentSq(playerPos, { x: startX, y: startY }, { x: endX, y: endY });

            if (distSq < (width / 2 + this.PLAYER_RADIUS) ** 2) {
                // Get beam damage with tier scaling
                const baseDmg = getEnemyDefinition(e.enemyType).attacks?.beam ?? (isBoss ? 20 : 12);
                const lvl = e.level || 1;
                const dmg = baseDmg * e.damageMult * (1 + lvl * (isBoss ? 0.03 : 0.02));

                const source = isBoss ? "Dreadnought Beam" : "Sniper Beam";
                callbacks.triggerPlayerHit(time, dmg, source);
            }
        }
    }
}

export const enemyLaserHandler = new EnemyLaserHandler();
