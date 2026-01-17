
import { BaseProjectile } from '../../../../core/entities/projectiles/BaseProjectile';
import { ProjectileType } from '../../../../types/projectiles';
import { WeaponType, EntityType } from '../../../../types';

export const renderBullet = (ctx: CanvasRenderingContext2D, p: BaseProjectile) => {
    ctx.save();
    ctx.translate(p.pos.x, p.pos.y);
    const angle = p.angle || Math.atan2(p.vel.y, p.vel.x);
    ctx.rotate(angle + Math.PI / 2);

    if (p.type === EntityType.PLAYER_BULLET) {
        // Check for Railgun - elongated plasma bolt like Star Wars
        if (p.weaponType === WeaponType.RAILGUN) {
            // Elongated plasma bolt (Star Wars blaster bolt style)
            const length = 25;  // Bolt length
            const width = 4;    // Bolt width

            // Outer glow
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#60a5fa';

            // Core (white)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, width, length, 0, 0, Math.PI * 2);
            ctx.fill();

            // Outer ring (blue)
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Trail effect
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.ellipse(0, length * 0.5, width * 0.6, length * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Standard Plasma/Flak bullets
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    } else {
        // Enemy Bullet (Plasma Blob)
        if (p.radius > 10) {
            // Heavy Plasma (Boss)
            ctx.shadowBlur = 40;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, p.radius * 0.7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(0, 0, p.radius * 1.2, 0, Math.PI * 2); ctx.fill();
        } else {
            // Standard Plasma
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = p.color || '#f97316'; ctx.lineWidth = 2; ctx.stroke();
        }
    }

    ctx.restore();
};
