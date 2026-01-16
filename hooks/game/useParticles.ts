
import { useRef, useCallback } from 'react';
import { Entity, EntityType, Vector2D } from '../../types';
import { ObjectPool, createEntity } from '../../core/utils/ObjectPool';
import { damageAggregator, explosionBatcher } from '../../core/systems/particles';

export const useParticles = () => {
    const particlesRef = useRef<Entity[]>([]);

    const poolRef = useRef<ObjectPool<Entity>>(
        new ObjectPool<Entity>(createEntity, (e) => {
            e.duration = 0;
            e.maxDuration = 0;
            e.value = 0;
            // pos/vel/color set on spawn
        })
    );

    const initParticles = useCallback(() => {
        const pool = poolRef.current;
        particlesRef.current.forEach(p => pool.release(p));
        particlesRef.current.length = 0;
    }, []);

    /**
     * Queue damage text for aggregation
     * Actual spawning happens in updateParticles via flush
     */
    const spawnDamageText = useCallback((pos: Vector2D, dmg: number, color: string = '#ffffff') => {
        damageAggregator.add(pos, dmg, color);
    }, []);

    /**
     * Queue explosion for batching
     * Actual spawning happens in updateParticles via flush
     */
    const spawnExplosion = useCallback((pos: Vector2D, radius: number, color: string = '#facc15') => {
        explosionBatcher.add(pos, radius, color);
    }, []);

    const spawnSpawnFlash = useCallback((pos: Vector2D) => {
        const pool = poolRef.current;
        const p = pool.get();

        p.id = Math.random().toString(36);
        p.type = EntityType.SPAWN_FLASH;
        p.pos.x = pos.x;
        p.pos.y = pos.y;
        p.vel.x = 0; p.vel.y = 0;
        p.radius = 60; // Max radius of flash
        p.color = '#ffffff';
        p.duration = 0;
        p.maxDuration = 0.5;

        particlesRef.current.push(p);
    }, []);

    const addParticles = useCallback((newParticles: Entity[]) => {
        const pool = poolRef.current;

        newParticles.forEach(src => {
            const p = pool.get();
            Object.assign(p, src);
            particlesRef.current.push(p);
        });
    }, []);

    /**
     * Spawn actual damage text particle from aggregated data
     */
    const spawnDamageTextInternal = useCallback((pos: Vector2D, dmg: number, color: string) => {
        const pool = poolRef.current;
        const p = pool.get();

        p.id = Math.random().toString(36);
        p.type = EntityType.DAMAGE_NUMBER;
        p.pos.x = pos.x + (Math.random() - 0.5) * 30;
        p.pos.y = pos.y - 15;
        p.vel.x = (Math.random() - 0.5) * 60;
        p.vel.y = -120;
        p.radius = 0;
        p.health = 1; p.maxHealth = 1;
        p.color = color;
        p.value = Math.floor(dmg);
        p.duration = 0;
        p.maxDuration = 0.8;

        particlesRef.current.push(p);
    }, []);

    /**
     * Spawn actual explosion particle from batched data
     */
    const spawnExplosionInternal = useCallback((pos: Vector2D, radius: number, color: string) => {
        const pool = poolRef.current;
        const p = pool.get();

        p.id = Math.random().toString(36);
        p.type = EntityType.EXPLOSION;
        p.pos.x = pos.x;
        p.pos.y = pos.y;
        p.vel.x = 0; p.vel.y = 0;
        p.radius = radius;
        p.color = color;
        p.duration = 0;
        p.maxDuration = 0.4;

        particlesRef.current.push(p);
    }, []);

    const updateParticles = useCallback((dt: number) => {
        const pool = poolRef.current;
        const particles = particlesRef.current;

        // Flush aggregated damage texts
        const aggregatedDamage = damageAggregator.flush();
        for (const dmg of aggregatedDamage) {
            spawnDamageTextInternal(dmg.pos, dmg.damage, dmg.color);
        }

        // Flush batched explosions
        const mergedExplosions = explosionBatcher.flush();
        for (const exp of mergedExplosions) {
            spawnExplosionInternal(exp.pos, exp.radius, exp.color);
        }

        // Backward loop for swap-remove
        for (let i = particles.length - 1; i >= 0; i--) {
            const e = particles[i];
            let alive = true;
            e.duration = (e.duration || 0) + dt;

            if (e.type === EntityType.DAMAGE_NUMBER) {
                e.pos.x += e.vel.x * dt;
                e.pos.y += e.vel.y * dt;
                if (e.duration >= (e.maxDuration || 0.8)) alive = false;
            } else if (e.type === EntityType.EXPLOSION) {
                if (e.duration > (e.maxDuration || 0.4)) alive = false;
            } else if (e.type === EntityType.SPAWN_FLASH) {
                if (e.duration > (e.maxDuration || 0.5)) alive = false;
            } else {
                // Failsafe for unknown particle types
                if (e.duration > 2.0) alive = false;
            }

            if (!alive) {
                pool.release(e);
                particles[i] = particles[particles.length - 1];
                particles.pop();
            }
        }
    }, [spawnDamageTextInternal, spawnExplosionInternal]);

    return { particlesRef, initParticles, spawnDamageText, spawnExplosion, spawnSpawnFlash, updateParticles, addParticles };
};
