import React from 'react';
import { PlayerStats, Vector2D, EntityType } from '../../types';
import { IEnemy } from '../../types/enemies';
import { IProjectile, ProjectileType } from '../../types/projectiles';

export interface ConsumableContext {
    setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
    playerPos: Vector2D;
    enemies: IEnemy[];
    projectiles: IProjectile[];
    setProjectiles: (p: IProjectile[]) => void; // Needed for EMP to clear bullets
    setScore: React.Dispatch<React.SetStateAction<number>>;
    spawnSpawnFlash: (pos: Vector2D) => void;
    spawnDamageText: (pos: Vector2D, dmg: number, color: string) => void;
    spawnExplosion: (pos: Vector2D, radius: number, color: string) => void;
}

export type ConsumableEffect = (ctx: ConsumableContext) => void;

export const CONSUMABLE_EFFECTS: Record<string, ConsumableEffect> = {
    'cons_heal': (ctx) => {
        ctx.setStats(s => ({ ...s, currentHealth: s.maxHealth }));
        ctx.spawnSpawnFlash(ctx.playerPos);
        ctx.spawnDamageText(ctx.playerPos, 0, '#4ade80'); // Green "0" or "HEAL" if we supported string
    },
    'cons_shield': (ctx) => {
        ctx.setStats(s => ({ ...s, currentShield: s.maxShield }));
        ctx.spawnSpawnFlash(ctx.playerPos);
    },
    'cons_emp': (ctx) => {
        // Kill all non-boss enemies
        ctx.enemies.forEach(e => {
            if (!e.isBoss) {
                e.health = 0; // Collision logic will handle death next frame
                ctx.spawnExplosion(e.pos, 50, '#06b6d4');
            }
        });

        // Clear Enemy Bullets
        // We need to filter the existing array. 
        // Note: ctx.projectiles is a reference to the current list.
        const newProjectiles = ctx.projectiles.filter(p => p.type !== EntityType.ENEMY_BULLET);
        ctx.setProjectiles(newProjectiles);

        // Flash Screen
        ctx.spawnSpawnFlash(ctx.playerPos);
    },
    'cons_nuke': (ctx) => {
        // Massive Damage in Radius
        ctx.spawnExplosion(ctx.playerPos, 600, '#f97316'); // Visual
        ctx.enemies.forEach(e => {
            const d = Math.hypot(e.pos.x - ctx.playerPos.x, e.pos.y - ctx.playerPos.y);
            if (d < 800) {
                // e.health -= 5000; // Direct modification
                // We should ideally use a takeDamage method if available, or just modify health as useGameLogic did.
                // useGameLogic modified e.health directly.
                e.health -= 5000;
                ctx.spawnDamageText(e.pos, 5000, '#f97316');
            }
        });
    },
    'cons_score': (ctx) => {
        ctx.setScore(s => s + 2500);
        ctx.spawnDamageText({ x: ctx.playerPos.x, y: ctx.playerPos.y - 50 }, 2500, '#fbbf24');
    }
};
