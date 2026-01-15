
import { Entity, EntityType, PlayerStats, WeaponType } from '../types';
import { LASER_LENGTH } from '../constants';

export const renderProjectiles = (ctx: CanvasRenderingContext2D, projectiles: Entity[], stats: PlayerStats, time: number) => {
    projectiles.forEach(e => {
        if (e.health <= 0) return;

        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);

        // Angle Calculation
        let angle = Math.atan2(e.vel.y, e.vel.x);
        if (e.weaponType === WeaponType.LASER) {
            angle = e.angle || 0;
        }

        // Render Trail
        if (!e.isCharging && e.type === EntityType.BULLET && e.weaponType !== WeaponType.LASER) {
            ctx.save();
            ctx.rotate(angle + Math.PI);
            const trailLen = 40;
            const tGrad = ctx.createLinearGradient(0, 0, trailLen, 0);
            tGrad.addColorStop(0, e.color);
            tGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = tGrad;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(0, -e.radius / 2, trailLen, e.radius);
            ctx.restore();
        }

        // Render Enemy Homing Trail (Boss Missile)
        if (e.type === EntityType.ENEMY_BULLET && e.isHoming) {
            ctx.save();
            ctx.rotate(angle + Math.PI);
            const trailLen = 50;
            const tGrad = ctx.createLinearGradient(0, 0, trailLen, 0);
            tGrad.addColorStop(0, '#a1a1aa'); // Smoky Grey
            tGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = tGrad;
            ctx.globalAlpha = 0.5;
            // Draw slightly wider trail for smoke
            ctx.fillRect(0, -e.radius / 1.5, trailLen, e.radius * 1.3);
            ctx.restore();
        }

        // Player Laser Rendering
        if (e.weaponType === WeaponType.LASER) {
            ctx.rotate(angle);

            if (e.isCharging) {
                const prog = e.chargeProgress || 0;
                ctx.strokeStyle = `rgba(168, 85, 247, ${0.2 + prog * 0.4})`; // Purple
                ctx.lineWidth = 1 + prog * 2;
                ctx.setLineDash([20, 15]);
                ctx.beginPath();
                ctx.moveTo(30, 0);
                ctx.lineTo(LASER_LENGTH, 0);
                ctx.stroke();

                ctx.shadowBlur = 10 + prog * 20;
                ctx.shadowColor = '#d8b4fe';
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.arc(20, 0, 5 + prog * 8, 0, Math.PI * 2);
                ctx.fill();

            } else if (e.isFiring) {
                const duration = e.duration || 0;
                const maxDur = stats.laserDuration || 0.3;
                const life = duration / maxDur;
                const width = Math.max(0, 40 * (1 - life));

                ctx.shadowBlur = 60; ctx.shadowColor = '#a855f7';
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, -width / 4, LASER_LENGTH, width / 2);

                ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
                ctx.fillRect(0, -width, LASER_LENGTH, width * 2);

                ctx.beginPath();
                ctx.fillStyle = '#fff';
                ctx.arc(20, 0, width * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
            return;
        }

        ctx.rotate(angle + Math.PI / 2);

        if (e.type === EntityType.BULLET) {
            if (e.weaponType === WeaponType.MISSILE) {
                ctx.shadowBlur = 20; ctx.shadowColor = e.color;
                ctx.fillStyle = e.color; ctx.fillRect(-8, -20, 16, 40);
                // Engine fire
                ctx.fillStyle = '#fff'; ctx.fillRect(-4, 20, 8, 10);
            } else if (e.weaponType === WeaponType.SWARM_LAUNCHER) {
                ctx.shadowBlur = 10; ctx.shadowColor = e.color;
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.lineTo(5, 5);
                ctx.lineTo(-5, 5);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(-2, 5, 4, 6);
            } else {
                ctx.shadowBlur = 15; ctx.shadowColor = e.color;
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = e.color; ctx.lineWidth = 3; ctx.stroke();
            }
        } else if (e.type === EntityType.ENEMY_BULLET) {
            ctx.shadowBlur = 20; ctx.shadowColor = e.color || '#f97316';

            if (e.isHoming) {
                // Rocket shape for enemy missiles
                ctx.fillStyle = e.color || '#f97316';
                ctx.fillRect(-3, -8, 6, 16);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-2, 8, 4, 4); // Thruster
            } else {
                // Plasma blob
                if (e.radius > 10) {
                    // Heavy Plasma (Boss)
                    ctx.shadowBlur = 40;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(0, 0, e.radius * 0.7, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = e.color;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath(); ctx.arc(0, 0, e.radius * 1.2, 0, Math.PI * 2); ctx.fill();
                    ctx.globalAlpha = 1.0;
                } else {
                    // Standard Plasma
                    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = e.color || '#f97316'; ctx.lineWidth = 2; ctx.stroke();
                }
            }
        }
        ctx.restore();
    });
};
