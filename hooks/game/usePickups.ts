
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
        const baseVal = enemy.type === EntityType.ENEMY_LASER_SCOUT ? 500 : (enemy.isMelee ? 250 : 100);
        const level = enemy.level || 1;

        // XP Gem
        drops.push({
            id: Math.random().toString(36), type: EntityType.XP_GEM,
            pos: { ...enemy.pos }, vel: { x: 0, y: 0 }, radius: 14, health: 1, maxHealth: 1, color: '#06b6d4',
            value: XP_PER_GEM * (enemy.type === EntityType.ENEMY_LASER_SCOUT ? 5 : (enemy.isMelee ? 3 : 1))
        });

        // Credit Drop
        if (Math.random() < 0.25) {
            drops.push({
                id: Math.random().toString(36), type: EntityType.CREDIT,
                pos: { ...enemy.pos }, vel: { x: 0, y: 0 }, radius: 15, health: 1, maxHealth: 1, color: '#fbbf24',
                value: (enemy.type === EntityType.ENEMY_LASER_SCOUT ? 100 : (enemy.isMelee ? 35 : 15))
            });
        }

        // PowerUp Drop (Consolidated logic for all powerups including health/shield)
        if (Math.random() < 0.05) { // 5% chance
            const powerUpId = getWeightedRandomPowerUp();
            const config = POWER_UPS[powerUpId];
            
            drops.push({
                id: Math.random().toString(36), type: EntityType.POWERUP,
                pos: { ...enemy.pos }, vel: { x: 0, y: 0 }, radius: 24, health: 1, maxHealth: 1, color: config.color,
                powerUpId: powerUpId
            });
        }

        pickupsRef.current.push(...drops);
        return baseVal * level; 
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
