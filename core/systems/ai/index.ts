/**
 * AI Behaviors - Index Exports
 */

export type { AIContext } from './AIContext';

// Movement Behaviors
export type { IMovementBehavior } from './behaviors/IMovementBehavior';
export { OrbitBehavior } from './behaviors/OrbitBehavior';
export type { OrbitConfig } from './behaviors/OrbitBehavior';
export { ChaseBehavior } from './behaviors/ChaseBehavior';
export type { ChaseConfig } from './behaviors/ChaseBehavior';
export { RushBehavior } from './behaviors/RushBehavior';
export type { RushConfig } from './behaviors/RushBehavior';
export { KiteBehavior } from './behaviors/KiteBehavior';
export type { KiteConfig } from './behaviors/KiteBehavior';

// Attack Behaviors
export type { IAttackBehavior } from './attacks/IAttackBehavior';
export { ProjectileAttack } from './attacks/ProjectileAttack';
export type { ProjectileAttackConfig } from './attacks/ProjectileAttack';
export { LaserAttack } from './attacks/LaserAttack';
export type { LaserAttackConfig } from './attacks/LaserAttack';
