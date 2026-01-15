
import { Entity, PlayerStats } from '../../../types';
import { BaseProjectile } from '../../../core/entities/projectiles/BaseProjectile';
import { WeaponEffect } from '../../../types/projectiles';
import { renderLaser } from './projectiles/LaserRenderer';
import { renderMissile, renderSwarmMissile } from './projectiles/MissileRenderer';
import { renderBullet } from './projectiles/BulletRenderer';

export const renderProjectiles = (ctx: CanvasRenderingContext2D, projectiles: BaseProjectile[], stats: PlayerStats, time: number) => {
    projectiles.forEach(p => {
        if (!p.isAlive) return; // Or p.health <= 0 if using legacy check, but BaseProjectile has isAlive

        // Delegate based on WeaponEffect or Type
        switch (p.weaponEffect) {
            case WeaponEffect.LASER:
                renderLaser(ctx, p);
                break;
            case WeaponEffect.HOMING:
                // Check if it's Swarm (Player) or Enemy Missile
                // Swarm renderSwarmMissile
                if (p.ownerId === 'player') {
                    renderSwarmMissile(ctx, p);
                } else {
                    renderMissile(ctx, p); // Enemy Homing
                }
                break;
            case WeaponEffect.EXPLOSIVE: // Player Missile
                renderMissile(ctx, p);
                break;
            default:
                renderBullet(ctx, p);
                break;
        }
    });
};
