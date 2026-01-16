/**
 * Collision Handler Interface
 * Strategy pattern for collision processing
 */

import { CollisionContext } from '../CollisionContext';

export interface ICollisionHandler {
    /**
     * Process collisions for this handler's domain
     */
    handle(ctx: CollisionContext): void;
}
