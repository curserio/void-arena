
import { BaseProjectile } from '../../../../core/entities/projectiles/BaseProjectile';
import { WeaponType, EntityType } from '../../../../types';
import { ProjectileType } from '../../../../types/projectiles';

export const renderMissile = (ctx: CanvasRenderingContext2D, p: BaseProjectile) => {
    ctx.save();
    ctx.translate(p.pos.x, p.pos.y);
    const angle = p.angle || Math.atan2(p.vel.y, p.vel.x);

    // Trail
    ctx.save();
    ctx.rotate(angle + Math.PI);
    const trailLen = p.type === EntityType.ENEMY_BULLET ? 50 : 40;
    const tGrad = ctx.createLinearGradient(0, 0, trailLen, 0);
    tGrad.addColorStop(0, p.type === EntityType.ENEMY_BULLET ? '#a1a1aa' : p.color);
    tGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = tGrad;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, -p.radius * 0.6, trailLen, p.radius * 1.2);
    ctx.restore();

    ctx.rotate(angle + Math.PI / 2);

    if (p.type === EntityType.PLAYER_BULLET) {
        // Player Missile
        ctx.shadowBlur = 20; ctx.shadowColor = p.color;
        ctx.fillStyle = p.color; ctx.fillRect(-8, -20, 16, 40);
        // Engine fire
        ctx.fillStyle = '#fff'; ctx.fillRect(-4, 20, 8, 10);
    } else {
        // Enemy Missile
        ctx.shadowBlur = 20; ctx.shadowColor = p.color || '#f97316';
        ctx.fillStyle = p.color || '#f97316';
        ctx.fillRect(-3, -8, 6, 16);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-2, 8, 4, 4); // Thruster
    }

    ctx.restore();
};

export const renderSwarmMissile = (ctx: CanvasRenderingContext2D, p: BaseProjectile) => {
    ctx.save();
    ctx.translate(p.pos.x, p.pos.y);
    const angle = p.angle || Math.atan2(p.vel.y, p.vel.x);

    ctx.rotate(angle + Math.PI / 2);

    ctx.shadowBlur = 10; ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, 5, 4, 6); // Thruster

    ctx.restore();
};
