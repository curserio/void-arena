/**
 * Death Handler
 * Processes enemy deaths, explosions, and Kamikaze blasts
 */

import { EnemyType } from '../../../../types/enemies';
import { ICollisionHandler } from './ICollisionHandler';
import { CollisionContext } from '../CollisionContext';
import { getEnemyDefinition } from '../../../../data/enemies/definitions';

export class DeathHandler implements ICollisionHandler {
    handle(ctx: CollisionContext): void {
        const { enemies, playerPos, callbacks, time } = ctx;

        for (const e of enemies) {
            // Check health and that we haven't processed this death yet
            if (e.health <= 0 && !(e as any).__deathProcessed) {
                callbacks.onEnemyKilled();

                // Death explosion VFX
                callbacks.spawnExplosion(e.pos, e.radius * 2.5, e.color);

                // Kamikaze blast damage to player
                if (e.enemyType === EnemyType.KAMIKAZE) {
                    const dist = Math.hypot(e.pos.x - playerPos.x, e.pos.y - playerPos.y);
                    const blastRadius = 120;

                    if (dist < blastRadius) {
                        const baseDmg = getEnemyDefinition(e.enemyType).attacks?.explosion ?? 40;
                        const blastDmg = baseDmg * e.damageMult * (1 + (e.level || 1) * 0.1);
                        callbacks.triggerPlayerHit(time, blastDmg, "Kamikaze Blast");
                    }

                    // Extra explosion VFX
                    callbacks.spawnExplosion(e.pos, 100, '#f97316');
                }
            }
        }
    }
}

export const deathHandler = new DeathHandler();
