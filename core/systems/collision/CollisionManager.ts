/**
 * Collision Manager
 * Orchestrates all collision handlers
 */

import { CollisionContext } from './CollisionContext';
import { ICollisionHandler } from './handlers/ICollisionHandler';
import { playerBulletHandler } from './handlers/PlayerBulletHandler';
import { playerBodyHandler } from './handlers/PlayerBodyHandler';
import { enemyBulletHandler } from './handlers/EnemyBulletHandler';
import { enemyLaserHandler } from './handlers/EnemyLaserHandler';
import { pickupHandler } from './handlers/PickupHandler';
import { deathHandler } from './handlers/DeathHandler';

export class CollisionManager {
    private handlers: ICollisionHandler[];

    constructor() {
        // Order matters: process attacks before death
        this.handlers = [
            playerBulletHandler,  // Player attacks enemies
            playerBodyHandler,    // Player touches enemies
            enemyBulletHandler,   // Enemy projectiles hit player
            enemyLaserHandler,    // Enemy beams hit player
            pickupHandler,        // Collect items
            deathHandler,         // Process deaths (kamikaze blast etc)
        ];
    }

    /**
     * Process all collision types in order
     */
    processAll(ctx: CollisionContext): void {
        for (const handler of this.handlers) {
            handler.handle(ctx);
        }
    }

    /**
     * Add a custom handler (for extensibility)
     */
    addHandler(handler: ICollisionHandler): void {
        this.handlers.push(handler);
    }
}

// Singleton instance
export const collisionManager = new CollisionManager();
