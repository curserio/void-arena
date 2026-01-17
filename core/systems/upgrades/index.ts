/**
 * Upgrades System
 * Re-exports upgrade calculation utilities
 */

export {
    calculateWeaponModifiers,
    calculateModuleModifiers,
    calculateGeneralModifiers,
    type WeaponModifiers,
    type ModuleModifiers,
    type GeneralModifiers
} from './UpgradeCalculator';

export { applyInGameUpgrade } from './InGameUpgradeCalculator';
