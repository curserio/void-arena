
import { BaseProjectile } from '../../../../core/entities/projectiles/BaseProjectile';
import { LASER_LENGTH } from '../../../../constants';

export const renderLaser = (ctx: CanvasRenderingContext2D, p: BaseProjectile) => {
    ctx.save();
    ctx.translate(p.pos.x, p.pos.y);
    const angle = p.angle || 0;
    ctx.rotate(angle);

    if (p.isCharging) {
        const prog = p.chargeProgress || 0;
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

    } else if (p.isFiring) {
        // Legacy Render Style
        // duration is death timestamp, elapsedTime is current age
        const remainingMs = Math.max(0, p.duration - p.elapsedTime);

        // Calculate visual width: shrinks linearly over the last ~320ms
        const visualWidth = Math.min(40, Math.max(0, remainingMs / 8));

        ctx.shadowBlur = 60; ctx.shadowColor = '#a855f7';
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -visualWidth / 4, LASER_LENGTH, visualWidth / 2);

        ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.fillRect(0, -visualWidth, LASER_LENGTH, visualWidth * 2);

        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.arc(20, 0, visualWidth * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};
