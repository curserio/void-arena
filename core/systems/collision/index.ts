/**
 * Collision System - Public Exports
 */

// Helpers
export { checkCircleCollision, distToSegmentSq, distance } from './CollisionHelpers';

// Context
export type { CollisionContext, CollisionCallbacks } from './CollisionContext';
export { applyDamageToEnemy } from './CollisionContext';

// Handlers
export type { ICollisionHandler } from './handlers/ICollisionHandler';
export { playerBulletHandler } from './handlers/PlayerBulletHandler';
export { playerBodyHandler } from './handlers/PlayerBodyHandler';
export { enemyBulletHandler } from './handlers/EnemyBulletHandler';
export { enemyLaserHandler } from './handlers/EnemyLaserHandler';
export { pickupHandler } from './handlers/PickupHandler';
export { deathHandler } from './handlers/DeathHandler';

// Manager
export { CollisionManager, collisionManager } from './CollisionManager';
