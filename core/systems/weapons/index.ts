/**
 * Weapons System
 * 
 * Re-exports weapon behavior interface and registers all weapon behaviors.
 */

// Export interface and registry
export {
    getWeaponBehavior,
    hasWeaponBehavior,
    registerWeaponBehavior,
    type WeaponBehavior,
    type FireContext
} from './WeaponBehavior';

// Import behaviors to register them
import './behaviors/PlasmaBehavior';
import './behaviors/LaserBehavior';
import './behaviors/MissileBehavior';
import './behaviors/RailgunBehavior';
import './behaviors/FlakBehavior';
import './behaviors/SwarmBehavior';
