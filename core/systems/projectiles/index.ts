/**
 * Projectile Systems - Public Exports
 */

// Behaviors
export type { IProjectileBehavior, ProjectileBehaviorContext, ExplosionData } from './behaviors/IProjectileBehavior';
export { StandardBehavior, standardBehavior } from './behaviors/StandardBehavior';
export { LaserBehavior, laserBehavior } from './behaviors/LaserBehavior';
export { HomingBehavior, homingBehavior } from './behaviors/HomingBehavior';

// Manager
export { ProjectileBehaviorManager, projectileBehaviorManager } from './ProjectileBehaviorManager';
