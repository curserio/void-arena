
import { Upgrade, UpgradeType, MetaUpgrade, WeaponType, ModuleType } from '../../types';

export const UPGRADES: Upgrade[] = [
    // --- UNIQUE UPGRADES (One Time Only, Strong Effects) ---
    {
        id: 'titan_gen',
        type: UpgradeType.STAT,
        name: 'Titan Generator',
        description: '+50 Max Shield (instant recharge).',
        icon: 'fa-shield-halved',
        rarity: 'LEGENDARY',
        maxStacks: 1,
        weight: 3,
        effects: [
            { stat: 'maxShield', value: 50, operation: 'addFlat' },
            { stat: 'currentShield', value: 50, operation: 'addFlat' }
        ]
    },
    {
        id: 'berserker_mod',
        type: UpgradeType.STAT,
        name: 'Berserker Module',
        description: '+35% Damage, -20% Max HP.',
        icon: 'fa-skull',
        rarity: 'LEGENDARY',
        maxStacks: 1,
        weight: 3,
        effects: [
            { stat: 'damage', value: 0.35, operation: 'addPercent' },
            { stat: 'maxHealth', value: 0.8, operation: 'setMultiply' },
            { stat: 'currentHealth', value: 0.8, operation: 'setMultiply' }
        ]
    },
    {
        id: 'nano_repair',
        type: UpgradeType.STAT,
        name: 'Nanite Weaver',
        description: 'Triples Shield Regen.',
        icon: 'fa-rotate',
        rarity: 'RARE',
        maxStacks: 1,
        weight: 5,
        effects: [{ stat: 'shieldRegen', value: 3.0, operation: 'setMultiply' }]
    },

    // --- STACKABLE UPGRADES (Small boosts, unlimited or high limit) ---
    {
        id: 'hull_plate',
        type: UpgradeType.STAT,
        name: 'Hull Plating',
        description: '+10 Max HP (heals 10).',
        icon: 'fa-heart',
        rarity: 'COMMON',
        maxStacks: 20,
        weight: 15,
        effects: [
            { stat: 'maxHealth', value: 10, operation: 'addFlat' },
            { stat: 'currentHealth', value: 10, operation: 'addFlat' }
        ]
    },
    {
        id: 'dmg_boost',
        type: UpgradeType.STAT,
        name: 'Core Reactor',
        description: '+10% Damage.',
        icon: 'fa-burst',
        rarity: 'COMMON',
        maxStacks: 99,
        weight: 12,
        effects: [{ stat: 'damage', value: 0.10, operation: 'addPercent' }]
    },
    {
        id: 'fire_rate',
        type: UpgradeType.STAT,
        name: 'Rapid Cycler',
        description: '+5% Fire Rate.',
        icon: 'fa-bolt',
        rarity: 'COMMON',
        maxStacks: 99,
        weight: 12,
        effects: [{ stat: 'fireRate', value: 0.05, operation: 'addPercent' }]
    },
    {
        id: 'speed_boost',
        type: UpgradeType.STAT,
        name: 'Ion Thrusters',
        description: '+5% Movement Speed.',
        icon: 'fa-forward',
        rarity: 'COMMON',
        maxStacks: 10,
        weight: 12,
        effects: [{ stat: 'speed', value: 0.05, operation: 'addPercent' }]
    },
    {
        id: 'crit_mod',
        type: UpgradeType.STAT,
        name: 'Lens Polish',
        description: '+5% Critical Chance.',
        icon: 'fa-crosshairs',
        rarity: 'RARE',
        maxStacks: 10,
        weight: 8,
        effects: [{ stat: 'critChance', value: 0.05, operation: 'addFlat', cap: 1.0 }]
    },
    {
        id: 'magnet_boost',
        type: UpgradeType.STAT,
        name: 'Gravity Field',
        description: '+15% Pickup Range.',
        icon: 'fa-magnet',
        rarity: 'COMMON',
        maxStacks: 5,
        weight: 10,
        effects: [{ stat: 'magnetRange', value: 0.15, operation: 'addPercent' }]
    },

    // --- CONSUMABLES (Infinite, Instant Effects, No Stats stored) ---
    {
        id: 'cons_heal',
        type: UpgradeType.CONSUMABLE,
        name: 'Emergency Repair',
        description: 'Instant: Restore 100% Hull Integrity.',
        icon: 'fa-heart-pulse',
        rarity: 'COMMON',
        maxStacks: 999,
        weight: 8,
    },
    {
        id: 'cons_shield',
        type: UpgradeType.CONSUMABLE,
        name: 'Shield Reboot',
        description: 'Instant: Fully Recharge Shields.',
        icon: 'fa-shield-virus',
        rarity: 'COMMON',
        maxStacks: 999,
        weight: 8,
    },
    {
        id: 'cons_emp',
        type: UpgradeType.CONSUMABLE,
        name: 'EMP Blast',
        description: 'Tactical: Destroy all active enemies and bullets on screen.',
        icon: 'fa-car-battery',
        rarity: 'RARE',
        maxStacks: 999,
        weight: 4,
    },
    {
        id: 'cons_nuke',
        type: UpgradeType.CONSUMABLE,
        name: 'Tactical Nuke',
        description: 'Tactical: Detonate a massive explosion around your ship.',
        icon: 'fa-radiation',
        rarity: 'RARE',
        maxStacks: 999,
        weight: 4,
    },
    {
        id: 'cons_score',
        type: UpgradeType.CONSUMABLE,
        name: 'Data Cache',
        description: 'Bonus: Instantly gain 2,500 Score.',
        icon: 'fa-database',
        rarity: 'COMMON',
        maxStacks: 999,
        weight: 10,
    }
];

// Meta Progression - Geometric Cost Scaling
// Cost = costBase * (costFactor ^ Level)
export const META_UPGRADES: MetaUpgrade[] = [
    // --- SURVIVAL ---
    {
        id: 'meta_hp',
        name: 'Titanium Hull',
        description: '+10% Max HP per level.',
        icon: 'fa-shield-heart',
        maxLevel: 50,
        costBase: 100,
        costFactor: 1.3,
        effects: [{ stat: 'maxHealth', perLevel: 0.10, operation: 'addPercent' }]
    },
    {
        id: 'meta_shield',
        name: 'Shield Generator',
        description: '+15% Shield Capacity per level.',
        icon: 'fa-shield-halved',
        maxLevel: 30,
        costBase: 150,
        costFactor: 1.35,
        effects: [{ stat: 'maxShield', perLevel: 0.15, operation: 'addPercent' }]
    },
    {
        id: 'meta_regen',
        name: 'Auto-Repair',
        description: '+10% Shield Regen per level.',
        icon: 'fa-rotate',
        maxLevel: 20,
        costBase: 300,
        costFactor: 1.4,
        effects: [{ stat: 'shieldRegen', perLevel: 0.10, operation: 'addPercent' }]
    },

    // --- OFFENSE ---
    {
        id: 'meta_dmg',
        name: 'Weapon Overclock',
        description: '+5% Base Damage per level.',
        icon: 'fa-fire',
        maxLevel: 100,
        costBase: 200,
        costFactor: 1.25,
        effects: [{ stat: 'baseDamage', perLevel: 0.05, operation: 'addPercent' }]
    },
    {
        id: 'meta_crit_chance',
        name: 'Predictive Algo',
        description: '+1% Crit Chance per level.',
        icon: 'fa-crosshairs',
        maxLevel: 25,
        costBase: 500,
        costFactor: 1.5,
        effects: [{ stat: 'critChance', perLevel: 0.01, operation: 'add' }]
    },
    {
        id: 'meta_crit_dmg',
        name: 'Lethal Frequency',
        description: '+5% Crit Damage per level.',
        icon: 'fa-skull-crossbones',
        maxLevel: 50,
        costBase: 400,
        costFactor: 1.3,
        effects: [{ stat: 'critDamage', perLevel: 0.05, operation: 'addPercent' }]
    },

    // --- UTILITY ---
    {
        id: 'meta_magnet',
        name: 'Tractor Beam',
        description: '+5% Pickup Radius per level.',
        icon: 'fa-magnet',
        maxLevel: 20,
        costBase: 100,
        costFactor: 1.25,
        effects: [{ stat: 'magnetRange', perLevel: 0.05, operation: 'addPercent' }]
    },
    {
        id: 'meta_speed',
        name: 'Thruster Tuning',
        description: '+2% Flight Speed per level.',
        icon: 'fa-forward-fast',
        maxLevel: 20,
        costBase: 800,
        costFactor: 1.4,
        effects: [{ stat: 'speed', perLevel: 0.02, operation: 'addPercent' }]
    },
    {
        id: 'meta_salvage',
        name: 'Salvage Protocols',
        description: '+5% Credits per level.',
        icon: 'fa-coins',
        maxLevel: 50,
        costBase: 500,
        costFactor: 1.2,
        effects: [{ stat: 'salvageBonus', perLevel: 0.05, operation: 'addPercent' }]
    },

    // --- WEAPON SPECIFIC: PLASMA ---
    { id: 'meta_plas_rate', name: 'Plasma Cycler', description: '+5% Fire Rate per level.', icon: 'fa-bolt', maxLevel: 10, costBase: 500, costFactor: 1.2, weaponType: WeaponType.PLASMA, effects: [{ stat: 'fireRate', perLevel: 0.05, operation: 'addPercent' }] },
    { id: 'meta_plas_area', name: 'Cryo-Plasma', description: 'Plasma slows enemies effectively (Chill).', icon: 'fa-snowflake', maxLevel: 10, costBase: 1000, costFactor: 1.6, weaponType: WeaponType.PLASMA }, // No numeric effect
    { id: 'meta_plas_dmg', name: 'Plasma Intensity', description: '+5% Damage per level.', icon: 'fa-fire-burner', maxLevel: 100, costBase: 200, costFactor: 1.12, weaponType: WeaponType.PLASMA, effects: [{ stat: 'damageMult', perLevel: 0.05, operation: 'addPercent' }] },
    { id: 'meta_plas_speed', name: 'Velocity Coil', description: '+8% Projectile Speed per level.', icon: 'fa-wind', maxLevel: 30, costBase: 400, costFactor: 1.2, weaponType: WeaponType.PLASMA, effects: [{ stat: 'bulletSpeed', perLevel: 0.08, operation: 'addPercent' }] },
    { id: 'meta_plas_count', name: 'Split Chamber', description: '+1 Projectile count.', icon: 'fa-clone', maxLevel: 2, costBase: 5000, costFactor: 2.5, weaponType: WeaponType.PLASMA, effects: [{ stat: 'bulletCount', perLevel: 1, operation: 'add' }] },

    // --- WEAPON SPECIFIC: MISSILE ---
    { id: 'meta_msl_rad', name: 'Warhead Yield', description: '+10% explosion radius per level.', icon: 'fa-bomb', maxLevel: 20, costBase: 4000, costFactor: 1.6, weaponType: WeaponType.MISSILE, effects: [{ stat: 'explosionRadius', perLevel: 0.10, operation: 'addPercent' }] },
    { id: 'meta_msl_dmg', name: 'Payload Potency', description: '+5% Damage per level.', icon: 'fa-explosion', maxLevel: 100, costBase: 500, costFactor: 1.12, weaponType: WeaponType.MISSILE, effects: [{ stat: 'damageMult', perLevel: 0.05, operation: 'addPercent' }] },
    { id: 'meta_msl_reload', name: 'Auto-Loader', description: '+5% Fire Rate per level.', icon: 'fa-repeat', maxLevel: 40, costBase: 1000, costFactor: 1.25, weaponType: WeaponType.MISSILE, effects: [{ stat: 'fireRate', perLevel: 0.05, operation: 'addPercent' }] },

    // --- WEAPON SPECIFIC: LASER ---
    { id: 'meta_lsr_recharge', name: 'Capacitor Banks', description: '+8% Fire Rate per level.', icon: 'fa-battery-full', maxLevel: 20, costBase: 2000, costFactor: 1.45, weaponType: WeaponType.LASER, effects: [{ stat: 'fireRate', perLevel: 0.08, operation: 'addPercent' }] },
    { id: 'meta_lsr_dmg', name: 'Beam Focus', description: '+5% Damage per level.', icon: 'fa-sun', maxLevel: 100, costBase: 800, costFactor: 1.12, weaponType: WeaponType.LASER, effects: [{ stat: 'damageMult', perLevel: 0.05, operation: 'addPercent' }] },
    { id: 'meta_lsr_duration', name: 'Heat Sinks', description: '+10% Beam Duration per level.', icon: 'fa-hourglass-start', maxLevel: 20, costBase: 1500, costFactor: 1.3, weaponType: WeaponType.LASER, effects: [{ stat: 'laserDuration', perLevel: 0.10, operation: 'addPercent' }] },

    // --- WEAPON SPECIFIC: SWARM LAUNCHER ---
    { id: 'meta_swarm_count', name: 'Extended Magazines', description: '+1 Rocket per salvo.', icon: 'fa-layer-group', maxLevel: 17, costBase: 10000, costFactor: 1.55, weaponType: WeaponType.SWARM_LAUNCHER, effects: [{ stat: 'swarmCount', perLevel: 1, operation: 'add' }] },
    { id: 'meta_swarm_agility', name: 'Thrust Vectoring', description: '+15% homing turn rate.', icon: 'fa-paper-plane', maxLevel: 20, costBase: 2000, costFactor: 1.3, weaponType: WeaponType.SWARM_LAUNCHER, effects: [{ stat: 'swarmAgility', perLevel: 0.15, operation: 'addPercent' }] },
    { id: 'meta_swarm_dmg', name: 'Micro-Warheads', description: '+5% Damage per level.', icon: 'fa-burst', maxLevel: 100, costBase: 600, costFactor: 1.15, weaponType: WeaponType.SWARM_LAUNCHER, effects: [{ stat: 'damageMult', perLevel: 0.05, operation: 'addPercent' }] },
    { id: 'meta_swarm_cd', name: 'Reloader Mechanism', description: '+5% Fire Rate per level.', icon: 'fa-clock', maxLevel: 50, costBase: 3000, costFactor: 1.25, weaponType: WeaponType.SWARM_LAUNCHER, effects: [{ stat: 'fireRate', perLevel: 0.05, operation: 'addPercent' }] },

    // --- MODULE: AFTERBURNER ---
    { id: 'meta_ab_dur', name: 'Fuel Injectors', description: '+1s Duration.', icon: 'fa-stopwatch', maxLevel: 10, costBase: 2000, costFactor: 1.3, moduleType: ModuleType.AFTERBURNER, effects: [{ stat: 'duration', perLevel: 1000, operation: 'add' }] },
    { id: 'meta_ab_cd', name: 'Coolant Flush', description: '-2s Cooldown.', icon: 'fa-snowflake', maxLevel: 15, costBase: 3000, costFactor: 1.35, moduleType: ModuleType.AFTERBURNER, effects: [{ stat: 'cooldown', perLevel: -2000, operation: 'add' }] },
    { id: 'meta_ab_spd', name: 'Turbine Overclock', description: '+10% Speed Boost.', icon: 'fa-forward', maxLevel: 10, costBase: 2500, costFactor: 1.4, moduleType: ModuleType.AFTERBURNER, effects: [{ stat: 'power', perLevel: 0.10, operation: 'addPercent' }] },

    // --- MODULE: SHIELD BURST ---
    { id: 'meta_sb_dur', name: 'Extended Barrier', description: '+0.25s Invulnerability.', icon: 'fa-hourglass-half', maxLevel: 6, costBase: 2500, costFactor: 1.35, moduleType: ModuleType.SHIELD_BURST, effects: [{ stat: 'duration', perLevel: 250, operation: 'add' }] },
    { id: 'meta_sb_cd', name: 'Rapid Recharge', description: '-0.2s Cooldown.', icon: 'fa-bolt', maxLevel: 8, costBase: 3000, costFactor: 1.4, moduleType: ModuleType.SHIELD_BURST, effects: [{ stat: 'cooldown', perLevel: -200, operation: 'add' }] },

    // --- WEAPON SPECIFIC: RAILGUN ---
    { id: 'meta_rail_dmg', name: 'Core Penetrator', description: '+5% Damage per level.', icon: 'fa-bolt', maxLevel: 100, costBase: 800, costFactor: 1.12, weaponType: WeaponType.RAILGUN, effects: [{ stat: 'damageMult', perLevel: 0.05, operation: 'addPercent' }] },
    { id: 'meta_rail_rate', name: 'Capacitor Array', description: '+5% Fire Rate per level.', icon: 'fa-gauge-high', maxLevel: 40, costBase: 1500, costFactor: 1.25, weaponType: WeaponType.RAILGUN, effects: [{ stat: 'fireRate', perLevel: 0.05, operation: 'addPercent' }] },
    { id: 'meta_rail_speed', name: 'Hypervelocity', description: '+10% Speed, +2% Damage.', icon: 'fa-fighter-jet', maxLevel: 20, costBase: 1000, costFactor: 1.3, weaponType: WeaponType.RAILGUN, effects: [{ stat: 'bulletSpeed', perLevel: 0.10, operation: 'addPercent' }, { stat: 'damageMult', perLevel: 0.02, operation: 'addPercent' }] },

    // --- WEAPON SPECIFIC: FLAK CANNON ---
    { id: 'meta_flak_dmg', name: 'Frag Rounds', description: '+5% Damage per level.', icon: 'fa-spray-can', maxLevel: 100, costBase: 600, costFactor: 1.12, weaponType: WeaponType.FLAK_CANNON, effects: [{ stat: 'damageMult', perLevel: 0.05, operation: 'addPercent' }] },
    { id: 'meta_flak_pellets', name: 'Scattershot', description: '+2 Pellets per shot.', icon: 'fa-ellipsis', maxLevel: 4, costBase: 8000, costFactor: 2.0, weaponType: WeaponType.FLAK_CANNON, effects: [{ stat: 'bulletCount', perLevel: 2, operation: 'add' }] },
    { id: 'meta_flak_range', name: 'Barrel Extension', description: '+8% Range per level.', icon: 'fa-ruler-horizontal', maxLevel: 20, costBase: 1200, costFactor: 1.25, weaponType: WeaponType.FLAK_CANNON, effects: [{ stat: 'bulletSpeed', perLevel: 0.08, operation: 'addPercent' }] },
    { id: 'meta_flak_rate', name: 'Rapid Pump', description: '+3% Fire Rate per level.', icon: 'fa-gauge-high', maxLevel: 10, costBase: 1500, costFactor: 1.3, weaponType: WeaponType.FLAK_CANNON, effects: [{ stat: 'fireRate', perLevel: 0.03, operation: 'addPercent' }] },
];
