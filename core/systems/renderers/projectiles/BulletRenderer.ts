
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
        } else if (p.weaponType === WeaponType.ENERGY_ORB) {
            // Large Pulsing Orb
            const pulseScale = 1.0 + Math.sin(Date.now() * 0.01) * 0.1; // Simple pulse effect

            // Outer Glow
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#c084fc';

            // Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Halo
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * pulseScale, 0, Math.PI * 2);
            ctx.stroke();

            // Reset
            ctx.globalAlpha = 1.0;

        } else if (p.weaponType === WeaponType.ARC_CASTER) {
            // Jagged Bolt
            // Flying Lightning Effect
            // A central glowing core
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#67e8f9';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            // Surrounding chaotic sparks
            ctx.strokeStyle = '#67e8f9';
            ctx.lineWidth = 2;
            const sparkCount = 4;
            for (let i = 0; i < sparkCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 5 + Math.random() * 10;
                ctx.beginPath();
                ctx.moveTo(0, 0);

                // Jagged line out
                const midX = Math.cos(angle) * (dist * 0.5) + (Math.random() - 0.5) * 5;
                const midY = Math.sin(angle) * (dist * 0.5) + (Math.random() - 0.5) * 5;
                const endX = Math.cos(angle) * dist;
                const endY = Math.sin(angle) * dist;

                ctx.lineTo(midX, midY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }

            // Trailing tail
            ctx.strokeStyle = 'rgba(103, 232, 249, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 15); // Trailing behind (since we rotated +90deg, y+ is "back"?)
            // Actually, we rotated angle + PI/2. 
            // Original: x+ is forward. Rotate +90 -> y+ is forward (0,-1 is up).
            // Let's standardise: 
            // 'angle' is velocity direction. 
            // 'rotate(angle)' makes x+ point in velocity.
            // 'rotate(angle + PI/2)' makes y- point in velocity (up).
            // So y+ is backward/tail.
            ctx.lineTo((Math.random() - 0.5) * 5, 25);
            ctx.stroke();

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
