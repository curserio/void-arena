
import { PlayerStats, Vector2D, GameState } from '../../../types';
import { SHIPS } from '../../../constants';

const drawBoostTrail = (ctx: CanvasRenderingContext2D, joystickDir: Vector2D, aimDir: Vector2D) => {
    ctx.save();
    // Rotate to trail behind movement
    let moveAngle = Math.atan2(joystickDir.y, joystickDir.x);
    if (joystickDir.x === 0 && joystickDir.y === 0) {
        // If not moving, trail behind facing direction
        moveAngle = Math.atan2(aimDir.y, aimDir.x);
    }
    ctx.rotate(moveAngle + Math.PI); // Point backwards

    // Draw multiple long streaks
    const length = 120 + Math.random() * 40;
    const width = 25;
    const grad = ctx.createLinearGradient(0, 0, length, 0);
    grad.addColorStop(0, 'rgba(217, 70, 239, 0.8)'); // Fuchsia start
    grad.addColorStop(1, 'rgba(217, 70, 239, 0)');   // Fade out

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -width / 2);
    ctx.lineTo(length, 0);
    ctx.lineTo(0, width / 2);
    ctx.fill();

    ctx.restore();
};

const drawReticle = (ctx: CanvasRenderingContext2D, aimDir: Vector2D) => {
    if (Math.abs(aimDir.x) <= 0.1 && Math.abs(aimDir.y) <= 0.1) return;

    const aimAngle = Math.atan2(aimDir.y, aimDir.x);
    ctx.save();
    ctx.rotate(aimAngle);

    // Dashed Laser Line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)'; // Faint Cyan
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]); // Dashed
    ctx.moveTo(35, 0); // Start outside ship
    ctx.lineTo(250, 0); // Draw out
    ctx.stroke();

    // Reticle End Marker (Chevron)
    ctx.setLineDash([]);
    ctx.shadowBlur = 10; ctx.shadowColor = '#22d3ee';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Chevron shape at end of line
    ctx.moveTo(240, -10);
    ctx.lineTo(255, 0);
    ctx.lineTo(240, 10);
    ctx.stroke();

    ctx.restore();
};

const drawShield = (ctx: CanvasRenderingContext2D, stats: PlayerStats, time: number) => {
    if (stats.currentShield < 1.0) return;

    const shieldRatio = stats.currentShield / stats.maxShield;
    const r = 58 * (1 + Math.sin(time * 0.01) * 0.04);
    ctx.strokeStyle = shieldRatio < 0.25 ? `rgba(255, 50, 50, ${0.5 + Math.sin(time * 0.02) * 0.3})` : 'rgba(34, 211, 238, 0.6)';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 25; ctx.shadowColor = shieldRatio < 0.25 ? '#ff0000' : '#00ffff';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();

    // Hex pattern simulation
    if (shieldRatio > 0.1) {
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath(); ctx.arc(0, 0, r - 5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
    }
};

const drawThrusters = (ctx: CanvasRenderingContext2D, isMoving: boolean, isBoostActive: boolean) => {
    if (!isMoving && !isBoostActive) return;

    ctx.fillStyle = isBoostActive ? '#d946ef' : '#fff'; // Pink if boosting
    const tLen = (15 + Math.random() * 15) * (isBoostActive ? 2 : 1);
    ctx.fillRect(-10, 20, 5, tLen);
    ctx.fillRect(5, 20, 5, tLen);
};

const drawShipBody = (ctx: CanvasRenderingContext2D, color: string, isHitActive: boolean) => {
    ctx.shadowBlur = 30; ctx.shadowColor = color;
    ctx.fillStyle = isHitActive ? '#ffffff' : color;
    ctx.beginPath();
    ctx.moveTo(0, -30); ctx.lineTo(-25, 25); ctx.lineTo(0, 15); ctx.lineTo(25, 25);
    ctx.closePath(); ctx.fill();

    // Cockpit
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(0, -5, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
};

export const renderPlayer = (
    ctx: CanvasRenderingContext2D,
    playerPos: Vector2D,
    joystickDir: Vector2D,
    aimDir: Vector2D,
    stats: PlayerStats,
    time: number,
    lastHitTime: number,
    gameState?: GameState
) => {
    // IF DYING, DO NOT RENDER SHIP
    if (gameState === GameState.DYING) return;

    const hitAge = time - lastHitTime;
    const isHitActive = hitAge < 250;
    const isBoostActive = time < stats.moduleActiveUntil;
    const isMoving = Math.abs(joystickDir.x) > 0.1 || Math.abs(joystickDir.y) > 0.1;

    ctx.save();
    ctx.translate(playerPos.x, playerPos.y);

    // 1. Boost Trail (Underneath everything)
    if (isBoostActive) {
        drawBoostTrail(ctx, joystickDir, aimDir);
    }

    // 2. Reticle (Independent rotation)
    drawReticle(ctx, aimDir);

    // 3. Ship Rotation
    if (isMoving) {
        ctx.rotate(Math.atan2(joystickDir.y, joystickDir.x) + Math.PI / 2);
    } else {
        if (Math.abs(aimDir.x) > 0.1 || Math.abs(aimDir.y) > 0.1) {
            ctx.rotate(Math.atan2(aimDir.y, aimDir.x) + Math.PI / 2);
        }
    }

    // 4. Shield (Around ship)
    drawShield(ctx, stats, time);

    // 5. Thrusters
    drawThrusters(ctx, isMoving, isBoostActive);

    // 6. Body
    const sColor = SHIPS.find(s => s.type === stats.shipType)?.color || '#22d3ee';
    drawShipBody(ctx, sColor, isHitActive);

    ctx.restore();
};
