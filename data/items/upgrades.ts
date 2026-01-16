
import { Upgrade, UpgradeType, MetaUpgrade, WeaponType, ModuleType } from '../../types';

export const UPGRADES: Upgrade[] = [
    // --- UNIQUE UPGRADES (One Time Only, Strong Effects) ---
    {
        id: 'titan_gen',
        type: UpgradeType.STAT,
        name: 'Titan Generator',
        description: 'Significantly increases Max Shield capacity.',
        icon: 'fa-shield-halved',
        rarity: 'LEGENDARY',
        maxStacks: 1,
        weight: 3,
        effect: (s) => ({ ...s, maxShield: s.maxShield + 50, currentShield: s.currentShield + 50 })
    },
    {
        id: 'berserker_mod',
        type: UpgradeType.STAT,
        name: 'Berserker Module',
        description: '+35% Damage, but -20% Max Integrity.',
        icon: 'fa-skull',
        rarity: 'LEGENDARY',
        maxStacks: 1,
        weight: 3,
        effect: (s) => ({
            ...s,
            damage: s.damage * 1.35,
            maxHealth: s.maxHealth * 0.8,
            currentHealth: Math.min(s.currentHealth, s.maxHealth * 0.8)
        })
    },
    {
        id: 'nano_repair',
        type: UpgradeType.STAT,
        name: 'Nanite Weaver',
        description: 'Triples Shield Regeneration rate.',
        icon: 'fa-rotate',
        rarity: 'RARE',
        maxStacks: 1,
        weight: 5,
        effect: (s) => ({ ...s, shieldRegen: s.shieldRegen * 3.0 })
    },

    // --- STACKABLE UPGRADES (Small boosts, unlimited or high limit) ---
    {
        id: 'hull_plate',
        type: UpgradeType.STAT,
        name: 'Hull Plating',
        description: '+10 Max Hull Integrity (Repairs 10 HP).',
        icon: 'fa-heart',
        rarity: 'COMMON',
        maxStacks: 20,
        weight: 15,
        effect: (s) => ({ ...s, maxHealth: s.maxHealth + 10, currentHealth: s.currentHealth + 10 })
    },
    {
        id: 'dmg_boost',
        type: UpgradeType.STAT,
        name: 'Core Reactor',
        description: '+10% Damage Output.',
        icon: 'fa-burst',
        rarity: 'COMMON',
        maxStacks: 99,
        weight: 12,
        effect: (s) => ({ ...s, damage: s.damage * 1.10 })
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
        effect: (s) => ({ ...s, fireRate: s.fireRate * 1.05 })
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
        effect: (s) => ({ ...s, speed: s.speed * 1.05 })
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
        effect: (s) => ({ ...s, critChance: Math.min(1.0, s.critChance + 0.05) })
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
        effect: (s) => ({ ...s, magnetRange: s.magnetRange * 1.15 })
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
        description: 'Increases hull integrity by +10% per level.',
        icon: 'fa-shield-heart',
        maxLevel: 50,
        costBase: 100,
        costFactor: 1.3
    },
    {
        id: 'meta_shield',
        name: 'Shield Generator',
        description: 'Boosts shield capacity by +15% per level.',
        icon: 'fa-shield-halved',
        maxLevel: 30,
        costBase: 150,
        costFactor: 1.35
    },
    {
        id: 'meta_regen',
        name: 'Auto-Repair',
        description: 'Shield recharges +10% faster per level.',
        icon: 'fa-rotate',
        maxLevel: 20,
        costBase: 300,
        costFactor: 1.4
    },

    // --- OFFENSE ---
    {
        id: 'meta_dmg',
        name: 'Weapon Overclock',
        description: 'Global +5% Damage multiplier per level.',
        icon: 'fa-fire',
        maxLevel: 100,
        costBase: 200,
        costFactor: 1.25
    },
    {
        id: 'meta_crit_chance',
        name: 'Predictive Algo',
        description: '+1% Critical Hit Chance per level.',
        icon: 'fa-crosshairs',
        maxLevel: 25,
        costBase: 500,
        costFactor: 1.5
    },
    {
        id: 'meta_crit_dmg',
        name: 'Lethal Frequency',
        description: '+5% Critical Hit Damage per level.',
        icon: 'fa-skull-crossbones',
        maxLevel: 50,
        costBase: 400,
        costFactor: 1.3
    },

    // --- UTILITY ---
    {
        id: 'meta_magnet',
        name: 'Tractor Beam',
        description: '+5% Pickup Radius per level.',
        icon: 'fa-magnet',
        maxLevel: 20,
        costBase: 100,
        costFactor: 1.25
    },
    {
        id: 'meta_speed',
        name: 'Thruster Tuning',
        description: '+2% Flight Speed per level.',
        icon: 'fa-forward-fast',
        maxLevel: 20,
        costBase: 800,
        costFactor: 1.4
    },
    {
        id: 'meta_salvage',
        name: 'Salvage Protocols',
        description: '+5% Credits earned per level.',
        icon: 'fa-coins',
        maxLevel: 50,
        costBase: 500,
        costFactor: 1.2
    },

    // --- WEAPON SPECIFIC: PLASMA ---
    { id: 'meta_plas_rate', name: 'Plasma Cycler', description: '+5% Fire Rate per level.', icon: 'fa-bolt', maxLevel: 10, costBase: 500, costFactor: 1.2, weaponType: WeaponType.PLASMA },
    { id: 'meta_plas_area', name: 'Cryo-Plasma', description: 'Plasma slows enemies effectively (Chill).', icon: 'fa-snowflake', maxLevel: 10, costBase: 1000, costFactor: 1.6, weaponType: WeaponType.PLASMA },
    { id: 'meta_plas_dmg', name: 'Plasma Intensity', description: '+5% Damage per level.', icon: 'fa-fire-burner', maxLevel: 100, costBase: 200, costFactor: 1.12, weaponType: WeaponType.PLASMA },
    { id: 'meta_plas_speed', name: 'Velocity Coil', description: '+8% Projectile Speed per level.', icon: 'fa-wind', maxLevel: 30, costBase: 400, costFactor: 1.2, weaponType: WeaponType.PLASMA },
    { id: 'meta_plas_count', name: 'Split Chamber', description: '+1 Projectile count.', icon: 'fa-clone', maxLevel: 2, costBase: 5000, costFactor: 2.5, weaponType: WeaponType.PLASMA },

    // --- WEAPON SPECIFIC: MISSILE ---
    { id: 'meta_msl_rad', name: 'Warhead Yield', description: 'Increases missile explosion radius.', icon: 'fa-bomb', maxLevel: 20, costBase: 4000, costFactor: 1.6, weaponType: WeaponType.MISSILE },
    { id: 'meta_msl_dmg', name: 'Payload Potency', description: '+5% Damage per level.', icon: 'fa-explosion', maxLevel: 100, costBase: 500, costFactor: 1.12, weaponType: WeaponType.MISSILE },
    { id: 'meta_msl_reload', name: 'Auto-Loader', description: '+5% Fire Rate per level.', icon: 'fa-repeat', maxLevel: 40, costBase: 1000, costFactor: 1.25, weaponType: WeaponType.MISSILE },

    // --- WEAPON SPECIFIC: LASER ---
    { id: 'meta_lsr_recharge', name: 'Capacitor Banks', description: 'Reduces Laser recharge time.', icon: 'fa-battery-full', maxLevel: 20, costBase: 2000, costFactor: 1.45, weaponType: WeaponType.LASER },
    { id: 'meta_lsr_dmg', name: 'Beam Focus', description: '+5% Damage per level.', icon: 'fa-sun', maxLevel: 100, costBase: 800, costFactor: 1.12, weaponType: WeaponType.LASER },
    { id: 'meta_lsr_duration', name: 'Heat Sinks', description: '+10% Beam Duration per level.', icon: 'fa-hourglass-start', maxLevel: 20, costBase: 1500, costFactor: 1.3, weaponType: WeaponType.LASER },

    // --- WEAPON SPECIFIC: SWARM LAUNCHER ---
    { id: 'meta_swarm_count', name: 'Extended Magazines', description: '+1 Rocket per salvo.', icon: 'fa-layer-group', maxLevel: 17, costBase: 10000, costFactor: 1.55, weaponType: WeaponType.SWARM_LAUNCHER },
    { id: 'meta_swarm_agility', name: 'Thrust Vectoring', description: 'Improves rocket homing turn rate.', icon: 'fa-paper-plane', maxLevel: 20, costBase: 2000, costFactor: 1.3, weaponType: WeaponType.SWARM_LAUNCHER },
    { id: 'meta_swarm_dmg', name: 'Micro-Warheads', description: '+5% Damage per level.', icon: 'fa-burst', maxLevel: 100, costBase: 600, costFactor: 1.15, weaponType: WeaponType.SWARM_LAUNCHER },
    { id: 'meta_swarm_cd', name: 'Reloader Mechanism', description: 'Reduces cooldown between salvos.', icon: 'fa-clock', maxLevel: 50, costBase: 3000, costFactor: 1.25, weaponType: WeaponType.SWARM_LAUNCHER },

    // --- MODULE: AFTERBURNER ---
    { id: 'meta_ab_dur', name: 'Fuel Injectors', description: '+1s Duration.', icon: 'fa-stopwatch', maxLevel: 10, costBase: 2000, costFactor: 1.3, moduleType: ModuleType.AFTERBURNER },
    { id: 'meta_ab_cd', name: 'Coolant Flush', description: '-2s Cooldown.', icon: 'fa-snowflake', maxLevel: 15, costBase: 3000, costFactor: 1.35, moduleType: ModuleType.AFTERBURNER },
    { id: 'meta_ab_spd', name: 'Turbine Overclock', description: '+10% Speed Boost.', icon: 'fa-forward', maxLevel: 10, costBase: 2500, costFactor: 1.4, moduleType: ModuleType.AFTERBURNER },

    // --- MODULE: SHIELD BURST ---
    { id: 'meta_sb_dur', name: 'Extended Barrier', description: '+0.25s Invulnerability.', icon: 'fa-hourglass-half', maxLevel: 6, costBase: 2500, costFactor: 1.35, moduleType: ModuleType.SHIELD_BURST },
    { id: 'meta_sb_cd', name: 'Rapid Recharge', description: '-2s Cooldown.', icon: 'fa-bolt', maxLevel: 8, costBase: 3000, costFactor: 1.4, moduleType: ModuleType.SHIELD_BURST },
];
