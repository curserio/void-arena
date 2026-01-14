
import { useRef, useCallback } from 'react';
import { Entity, EntityType, Vector2D, PlayerStats } from '../../types';
import { XP_PER_GEM } from '../../constants';
import { getWeightedRandomPowerUp, POWER_UPS } from '../../systems/PowerUpSystem';

export const usePickups = (
    playerPosRef: React.MutableRefObject<Vector2D>,
    statsRef: React.MutableRefObject<PlayerStats>
) => {
    const pickupsRef = useRef<Entity[]>([]);

    const initPickups = useCallback(() => {
        pickupsRef.current = [];
    }, []);

    const spawnDrops = useCallback((enemy: Entity) => {
        const drops: Entity[] = [];
        
        // Scaling Factors
        const level = enemy.level || 1;
        const isElite = enemy.isElite || false;
        const isMiniboss = enemy.isMiniboss || false;
        const isBoss = enemy.type === EntityType.ENEMY_BOSS;
        
        // Multipliers
        let rewardMult = 1.0;
        if (isBoss) rewardMult = 50.0; // Boss Mega Jackpot
        else if (isMiniboss) rewardMult = 15.0; 
        else if (isElite) rewardMult = 5.0; 

        const levelMult = 1 + (level * 0.2);    // +20% value per enemy level

        // 1. SCORE CALCULATION
        let baseScore = 100; // Scout
        if (enemy.type === EntityType.ENEMY_STRIKER) baseScore = 250;
        if (enemy.type === EntityType.ENEMY_LASER_SCOUT) baseScore = 500;
        if (isBoss) baseScore = 5000;
        
        const finalScore = Math.floor(baseScore * levelMult * rewardMult);

        // 2. XP GEM GENERATION
        // Base Multipliers based on enemy difficulty
        let typeXpMult = 1; // Scout
        if (enemy.isMelee) typeXpMult = 3; // Striker
        if (enemy.type === EntityType.ENEMY_LASER_SCOUT) typeXpMult = 5;
        if (isBoss) typeXpMult = 20;

        // Formula: BaseGem(15) * Type * LevelScaling * EliteBonus
        const xpValue = Math.ceil(XP_PER_GEM * typeXpMult * (1 + (level * 0.1)) * rewardMult);

        drops.push({
            id: Math.random().toString(36), type: EntityType.XP_GEM,
            pos: { ...enemy.pos }, vel: { x: 0, y: 0 }, radius: 14, health: 1, maxHealth: 1, color: '#06b6d4',
            value: xpValue
        });

        // 3. CREDIT DROP GENERATION
        // Chance: 33% base, 100% for Elites/Minibosses/Bosses
        const dropChance = (isElite || isMiniboss || isBoss) ? 1.0 : 0.33;

        if (Math.random() < dropChance) {
            // Increased Base Values
            let baseCredits = 30; 
            if (enemy.type === EntityType.ENEMY_STRIKER) baseCredits = 60;
            if (enemy.type === EntityType.ENEMY_LASER_SCOUT) baseCredits = 150;
            if (isBoss) baseCredits = 1000;

            // Formula: Base * LevelScaling * EliteBonus
            const creditValue = Math.floor(baseCredits * levelMult * rewardMult);

            drops.push({
                id: Math.random().toString(36), type: EntityType.CREDIT,
                pos: { ...enemy.pos }, vel: { x: 0, y: 0 }, radius: 15, health: 1, maxHealth: 1, color: '#fbbf24',
                value: creditValue
            });
        }

        // 4. POWERUP GENERATION
        // Chance: 5% base, 25% Elite, 50% Miniboss, 100% Boss
        let powerUpChance = 0.05;
        if (isBoss) powerUpChance = 1.0;
        else if (isMiniboss) powerUpChance = 0.5;
        else if (isElite) powerUpChance = 0.25;

        if (Math.random() < powerUpChance) { 
            const powerUpId = getWeightedRandomPowerUp();
            const config = POWER_UPS[powerUpId];
            
            drops.push({
                id: Math.random().toString(36), type: EntityType.POWERUP,
                pos: { ...enemy.pos }, vel: { x: 0, y: 0 }, radius: 24, health: 1, maxHealth: 1, color: config.color,
                powerUpId: powerUpId
            });
        }

        pickupsRef.current.push(...drops);
        return finalScore; 
    }, []);

    const updatePickups = useCallback((dt: number) => {
        const pStats = statsRef.current;
        const nextPickups: Entity[] = [];
        const collected: Entity[] = [];

        pickupsRef.current.forEach(e => {
            let alive = true;
            const d = Math.hypot(e.pos.x - playerPosRef.current.x, e.pos.y - playerPosRef.current.y);

            if (d < pStats.magnetRange) {
                const pullSpeed = 1800;
                e.vel.x = ((playerPosRef.current.x - e.pos.x) / d) * pullSpeed;
                e.vel.y = ((playerPosRef.current.y - e.pos.y) / d) * pullSpeed;
                e.pos.x += e.vel.x * dt;
                e.pos.y += e.vel.y * dt;
            }

            if (d < 50) {
                alive = false;
                collected.push(e);
            }

            if (alive) nextPickups.push(e);
        });

        pickupsRef.current = nextPickups;
        return collected;
    }, [playerPosRef, statsRef]);

    return { pickupsRef, initPickups, spawnDrops, updatePickups };
};
