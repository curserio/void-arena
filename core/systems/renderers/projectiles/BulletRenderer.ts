
import { BaseProjectile } from '../../../../core/entities/projectiles/BaseProjectile';
import { ProjectileType } from '../../../../types/projectiles';
import { WeaponType, EntityType } from '../../../../types';

export const renderBullet = (ctx: CanvasRenderingContext2D, p: BaseProjectile) => {
    ctx.save();
    ctx.translate(p.pos.x, p.pos.y);
    const angle = p.angle || Math.atan2(p.vel.y, p.vel.x);
    ctx.rotate(angle + Math.PI / 2);

    if (p.type === EntityType.PLAYER_BULLET) {
        // Assume default bullet for now if weaponType is not strictly tracked or just visual
        // For Plasma:
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.stroke();
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
