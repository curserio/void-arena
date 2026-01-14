import { useRef, useCallback } from 'react';
import { Entity, EntityType, Vector2D } from '../../types';

export const useParticles = () => {
    const particlesRef = useRef<Entity[]>([]);

    const initParticles = useCallback(() => {
        particlesRef.current = [];
    }, []);

    const spawnDamageText = useCallback((pos: Vector2D, dmg: number, color: string = '#ffffff') => {
        if (dmg <= 0) return;
        particlesRef.current.push({
            id: Math.random().toString(36),
            type: EntityType.DAMAGE_NUMBER,
            pos: { x: pos.x + (Math.random() - 0.5) * 30, y: pos.y - 15 },
            vel: { x: (Math.random() - 0.5) * 60, y: -120 },
            radius: 0, health: 1, maxHealth: 1, color: color,
            value: Math.floor(dmg), duration: 0, maxDuration: 0.8
        });
    }, []);

    const addParticles = useCallback((newParticles: Entity[]) => {
        particlesRef.current.push(...newParticles);
    }, []);

    const updateParticles = useCallback((dt: number) => {
        const nextParticles: Entity[] = [];
        particlesRef.current.forEach(e => {
            let alive = true;
            e.duration = (e.duration || 0) + dt;

            if (e.type === EntityType.DAMAGE_NUMBER) {
                e.pos.x += e.vel.x * dt;
                e.pos.y += e.vel.y * dt;
                if (e.duration >= (e.maxDuration || 0.8)) alive = false;
            } else if (e.type === EntityType.EXPLOSION) {
                if (e.duration > (e.maxDuration || 0.4)) alive = false;
            }

            if (alive) nextParticles.push(e);
        });
        particlesRef.current = nextParticles;
    }, []);

    return { particlesRef, initParticles, spawnDamageText, updateParticles, addParticles };
};
