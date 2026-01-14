
import { Entity, EntityType, PlayerStats, Vector2D, WeaponType, PowerUpType } from '../types';
import { SHIPS, GAME_ZOOM, WORLD_SIZE } from '../constants';

const getAsteroidPoints = (seed: number, radius: number) => {
  const points: Vector2D[] = [];
  const segments = 10;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const noise = Math.sin(seed * 123.45 + angle * 67.89) * 0.3 + 1;
    points.push({
      x: Math.cos(angle) * radius * noise,
      y: Math.sin(angle) * radius * noise
    });
  }
  return points;
};

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  entities: Entity[],
  playerPos: Vector2D,
  cameraPos: Vector2D,
  stats: PlayerStats,
  joystickDir: Vector2D,
  time: number,
  isFrenzy: boolean,
  lastPlayerHitTime: number
) => {
  const sCX = canvas.width / 2;
  const sCY = canvas.height / 2;

  const hitAge = time - lastPlayerHitTime;
  const isHitActive = hitAge < 250;
  const hitIntensity = isHitActive ? 1 - (hitAge / 250) : 0;

  ctx.save();
  ctx.translate(sCX, sCY);
  if (isHitActive) {
    const shakeAmount = hitIntensity * 15;
    ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
  }
  ctx.scale(GAME_ZOOM, GAME_ZOOM);
  ctx.translate(-cameraPos.x, -cameraPos.y);

  // DRAW WORLD BOUNDARY
  ctx.save();
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 10;
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#06b6d4';
  ctx.setLineDash([100, 50]);
  ctx.lineDashOffset = -time * 0.05;
  ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);
  
  // Secondary faint glow for boundary
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
  ctx.lineWidth = 30;
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);
  ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);
  ctx.restore();

  entities.forEach(e => {
    // Enemy Laser Beam Logic (drawn before the enemy body)
    if (e.type === EntityType.ENEMY_LASER_SCOUT && (e.isFiring || e.isCharging)) {
        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);
        ctx.rotate(e.angle || 0);
        
        if (e.isCharging) {
            const prog = e.chargeProgress || 0;
            // Целеуказатель (становится ярче и толще)
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.1 + prog * 0.6})`;
            ctx.lineWidth = 1 + prog * 2;
            ctx.setLineDash([15, 8]);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1000, 0); ctx.stroke();
            
            // Сходящиеся кольца (по аналогии с лазером игрока)
            ctx.shadowBlur = 10 + prog * 30; ctx.shadowColor = '#a855f7';
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 + prog * 0.7})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            for (let i = 0; i < 3; i++) {
                const arcTime = time * 0.008 + i * 2.5;
                // Радиус сужается к центру по мере prog
                const r = 80 * (1 - prog) + Math.sin(arcTime) * 15;
                if (r > 2) {
                    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
                }
            }

            // Центральное свечение
            const pulse = 1 + Math.sin(time * 0.05) * 0.1;
            const sphereGrad = ctx.createRadialGradient(0, 0, 0.1, 0, 0, e.radius * 0.8 * prog * pulse);
            sphereGrad.addColorStop(0, '#fff');
            sphereGrad.addColorStop(0.6, '#a855f7');
            sphereGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = sphereGrad;
            ctx.beginPath(); ctx.arc(0, 0, e.radius * pulse, 0, Math.PI * 2); ctx.fill();
        }

        if (e.isFiring) {
            const prog = e.chargeProgress || 0; 
            const width = 25 * (1 - prog);
            ctx.shadowBlur = 40; ctx.shadowColor = '#f00';
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, -width/2, 1000, width);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(0, -width, 1000, width * 2);
        }
        ctx.restore();
    }

    ctx.save();
    ctx.translate(e.pos.x, e.pos.y);

    if (e.type === EntityType.DAMAGE_NUMBER) {
      const prog = (e.duration || 0) / (e.maxDuration || 0.8);
      const scale = prog < 0.2 ? 1 + (0.2 - prog) * 2.5 : 1;
      ctx.globalAlpha = 1 - Math.pow(prog, 2);
      ctx.scale(scale, scale);
      ctx.fillStyle = e.color || '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = '900 32px Arial, sans-serif';
      ctx.textAlign = 'center';
      const txt = e.value?.toString() || '0';
      ctx.strokeText(txt, 0, 0);
      ctx.fillText(txt, 0, 0);
      ctx.globalAlpha = 1.0;
    } else if (e.type === EntityType.EXPLOSION) {
      const prog = (e.duration || 0) / (e.maxDuration || 1);
      const r = Math.max(0.1, e.radius * (0.3 + Math.pow(prog, 0.5) * 0.7));
      const grad = ctx.createRadialGradient(0, 0, 0.1, 0, 0, r);
      grad.addColorStop(0, `rgba(255, 255, 255, ${1 - prog})`);
      grad.addColorStop(0.2, `rgba(255, 220, 100, ${(1 - prog) * 0.8})`);
      grad.addColorStop(0.5, `rgba(255, 100, 0, ${(1 - prog) * 0.5})`);
      grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      if (prog < 0.3) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${(0.3 - prog) * 3})`;
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (e.type === EntityType.ENEMY_SCOUT || e.type === EntityType.ENEMY_STRIKER || e.type === EntityType.ENEMY_LASER_SCOUT) {
      const isRecentlyHit = (time - (e.lastHitTime || 0)) < 80;
      const isShieldHit = (time - (e.lastShieldHitTime || 0)) < 120;
      const isElite = (e.level || 1) > 4;

      // HUD above enemy
      ctx.save();
      const hudY = -e.radius - 20;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      const typeLabel = (isElite ? 'Elite ' : '') + 
        (e.type === EntityType.ENEMY_STRIKER ? 'Striker' : 
         e.type === EntityType.ENEMY_LASER_SCOUT ? 'Vanguard' : 'Scout');
      const label = `Lv.${e.level} ${typeLabel}`;
      ctx.fillStyle = isElite ? '#f0f' : '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(label, 0, hudY - 15);
      ctx.fillText(label, 0, hudY - 15);

      const barW = 60;
      const barH = 5;
      const barX = -barW / 2;

      // HP Bar
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, hudY - 5, barW, barH);
      const hpRatio = Math.max(0, e.health / e.maxHealth);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, hudY - 5, barW * hpRatio, barH);

      // Shield Bar
      if (e.maxShield && e.maxShield > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, hudY, barW, barH);
        const shRatio = Math.max(0, (e.shield || 0) / e.maxShield);
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(barX, hudY, barW * shRatio, barH);
      }
      ctx.restore();

      // Enemy shield visual aura
      if (e.shield !== undefined && e.shield > 0) {
        ctx.save();
        const sPulse = 1 + Math.sin(time * 0.01) * 0.05;
        const shRad = e.radius * 1.25 * sPulse;
        if (isShieldHit) {
          ctx.shadowBlur = 30; ctx.shadowColor = '#0ff';
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
        } else {
          ctx.shadowBlur = 10; ctx.shadowColor = '#22d3ee';
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)'; ctx.lineWidth = 2;
        }
        ctx.beginPath(); ctx.arc(0, 0, shRad, 0, Math.PI * 2); ctx.stroke();
        if (isShieldHit) { ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.fill(); }
        ctx.restore();
      }

      if (isElite) {
        ctx.save();
        ctx.shadowBlur = 20; ctx.shadowColor = e.color;
        ctx.strokeStyle = e.color; ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.rotate(time * 0.002);
        ctx.beginPath(); ctx.arc(0, 0, e.radius * 1.3, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      // ОПРЕДЕЛЕНИЕ УГЛА КОРПУСА
      if (e.type === EntityType.ENEMY_LASER_SCOUT && (e.isCharging || e.isFiring)) {
        ctx.rotate((e.angle || 0) + Math.PI/2);
      } else {
        ctx.rotate(Math.atan2(e.vel.y, e.vel.x) + Math.PI/2);
      }

      ctx.shadowBlur = 15; ctx.shadowColor = e.color;
      if (isShieldHit) ctx.fillStyle = '#99f6ff';
      else ctx.fillStyle = isRecentlyHit ? '#ffffff' : e.color;

      if (e.type === EntityType.ENEMY_SCOUT) {
        ctx.beginPath();
        ctx.moveTo(0, -e.radius);
        ctx.lineTo(-e.radius * 0.8, e.radius * 0.5);
        ctx.lineTo(-e.radius * 0.3, e.radius * 0.3);
        ctx.lineTo(0, e.radius * 0.8);
        ctx.lineTo(e.radius * 0.3, e.radius * 0.3);
        ctx.lineTo(e.radius * 0.8, e.radius * 0.5);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = (isRecentlyHit || isShieldHit) ? '#ffffff' : '#ffffff'; 
        ctx.beginPath(); ctx.arc(0, -e.radius * 0.2, e.radius * 0.15, 0, Math.PI * 2); ctx.fill();
      } else if (e.type === EntityType.ENEMY_LASER_SCOUT) {
        // Sleek Vanguard Sniper Look
        ctx.beginPath();
        ctx.moveTo(0, -e.radius * 1.2);
        ctx.lineTo(-e.radius * 0.5, e.radius * 0.5);
        ctx.lineTo(0, e.radius * 0.2);
        ctx.lineTo(e.radius * 0.5, e.radius * 0.5);
        ctx.closePath(); ctx.fill();
        
        // Fins
        ctx.fillStyle = isRecentlyHit ? '#fff' : '#4f46e5';
        ctx.fillRect(-e.radius * 0.8, 0, e.radius * 0.3, e.radius * 0.6);
        ctx.fillRect(e.radius * 0.5, 0, e.radius * 0.3, e.radius * 0.6);

        // Weapon core
        ctx.fillStyle = '#f00';
        ctx.beginPath(); ctx.arc(0, -e.radius * 0.4, e.radius * 0.2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -e.radius);
        ctx.lineTo(-e.radius, 0);
        ctx.lineTo(-e.radius * 0.8, e.radius);
        ctx.lineTo(0, e.radius * 0.4);
        ctx.lineTo(e.radius * 0.8, e.radius);
        ctx.lineTo(e.radius, 0);
        // Added ctx. prefix to closePath() call below
        ctx.closePath(); ctx.fill();
        const enginePulse = 1 + Math.sin(time * 0.02) * 0.3;
        ctx.fillStyle = (isRecentlyHit || isShieldHit) ? '#ffffff' : '#ff4400';
        ctx.beginPath(); ctx.arc(0, e.radius * 0.5, e.radius * 0.3 * enginePulse, 0, Math.PI * 2); ctx.fill();
      }
    } else if (e.type === EntityType.BULLET) {
        const bulletAngle = e.isCharging ? (e.angle || 0) : Math.atan2(e.vel.y, e.vel.x);
        ctx.rotate(bulletAngle + Math.PI/2);
        if (e.weaponType === WeaponType.LASER) {
            if (e.isCharging) {
                const prog = e.chargeProgress || 0;
                ctx.shadowBlur = 10 + prog * 30; ctx.shadowColor = '#fff';
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                for (let i = 0; i < 3; i++) {
                    const arcTime = time * 0.01 + i * 2;
                    const r = 50 * (1 - prog) + Math.sin(arcTime) * 12;
                    ctx.beginPath(); ctx.arc(0, -35, Math.max(0, r), 0, Math.PI * 2); ctx.stroke();
                }
                const sphereGrad = ctx.createRadialGradient(0, -35, 0.1, 0, -35, Math.max(0.2, 22 * prog));
                sphereGrad.addColorStop(0, '#fff'); sphereGrad.addColorStop(0.5, '#a855f7'); sphereGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = sphereGrad; ctx.beginPath(); ctx.arc(0, -35, Math.max(0.1, 22 * prog), 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.shadowBlur = 50; ctx.shadowColor = '#a855f7';
                ctx.fillStyle = '#fff'; ctx.fillRect(-12, -150, 24, 300);
                ctx.fillStyle = 'rgba(168, 85, 247, 0.6)'; ctx.fillRect(-20, -150, 40, 300);
            }
        } else if (e.weaponType === WeaponType.MISSILE) {
            ctx.shadowBlur = 15; ctx.shadowColor = e.color;
            ctx.fillStyle = e.color; ctx.fillRect(-7, -18, 14, 36);
            ctx.fillStyle = '#fff'; ctx.fillRect(-3, -10, 6, 15);
            const grad = ctx.createLinearGradient(0, 18, 0, 40);
            grad.addColorStop(0, e.color); grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad; ctx.fillRect(-5, 18, 10, 22);
        } else {
            ctx.shadowBlur = 15; ctx.shadowColor = e.color;
            const grad = ctx.createLinearGradient(0, -e.radius, 0, e.radius * 2);
            grad.addColorStop(0, '#fff'); grad.addColorStop(0.4, e.color); grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
        }
    } else if (e.type === EntityType.ENEMY_BULLET) {
        ctx.rotate(Math.atan2(e.vel.y, e.vel.x) + Math.PI/2);
        ctx.shadowBlur = 20; ctx.shadowColor = '#f97316';
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, e.radius + 2, 0, Math.PI * 2); ctx.stroke();
        const trailLen = e.radius * 4;
        const grad = ctx.createLinearGradient(0, 0, 0, trailLen);
        grad.addColorStop(0, '#f97316'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(-e.radius, 0); ctx.lineTo(0, trailLen); ctx.lineTo(e.radius, 0); ctx.fill();
    } else if (e.type === EntityType.ASTEROID) {
        const isRecentlyHit = (time - (e.lastHitTime || 0)) < 80;
        const pts = getAsteroidPoints(e.seed || 0, e.radius);
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for(let i=1; i<pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        const grad = ctx.createRadialGradient(-e.radius*0.3, -e.radius*0.3, 0.1, 0, 0, Math.max(0.1, e.radius));
        grad.addColorStop(0, isRecentlyHit ? '#ffffff' : '#64748b'); grad.addColorStop(1, isRecentlyHit ? '#ffffff' : '#1e293b');
        ctx.fillStyle = grad; ctx.fill();
        ctx.strokeStyle = isRecentlyHit ? '#ffffff' : '#94a3b8'; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (e.type === EntityType.POWERUP) {
        const pulse = 1 + Math.sin(time * 0.01) * 0.15;
        ctx.rotate(time * 0.002);
        ctx.shadowBlur = 25; ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0ff'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.rect(-18*pulse, -18*pulse, 36*pulse, 36*pulse); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let txt = '?';
        if (e.powerUpType === PowerUpType.OVERDRIVE) { txt = 'F'; ctx.shadowColor = '#f0f'; ctx.strokeStyle = '#f0f'; }
        if (e.powerUpType === PowerUpType.OMNI_SHOT) { txt = 'M'; ctx.shadowColor = '#fbbf24'; ctx.strokeStyle = '#fbbf24'; }
        if (e.powerUpType === PowerUpType.SUPER_PIERCE) { txt = 'P'; ctx.shadowColor = '#22d3ee'; ctx.strokeStyle = '#22d3ee'; }
        ctx.fillText(txt, 0, 0);
    } else if (e.type === EntityType.XP_GEM) {
        ctx.shadowBlur = 15; ctx.shadowColor = '#06b6d4';
        ctx.rotate(time / 150); ctx.fillStyle = '#fff'; ctx.fillRect(-9, -9, 18, 18);
        ctx.fillStyle = '#06b6d4'; ctx.fillRect(-6, -6, 12, 12);
    } else if (e.type === EntityType.CREDIT) {
        ctx.shadowBlur = 15; ctx.shadowColor = '#fbbf24';
        ctx.rotate(time / 100); ctx.fillStyle = '#fbbf24'; ctx.beginPath(); 
        ctx.moveTo(0, -14); ctx.lineTo(14, 0); ctx.lineTo(0, 14); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  });

  // Player Rendering
  ctx.save();
  ctx.translate(playerPos.x, playerPos.y);
  if (joystickDir.x !== 0 || joystickDir.y !== 0) ctx.rotate(Math.atan2(joystickDir.y, joystickDir.x) + Math.PI / 2);
  if (stats.currentShield >= 1.0) {
    const shieldRatio = stats.currentShield / stats.maxShield;
    const r = 55 * (1 + Math.sin(time * 0.01) * 0.03);
    ctx.strokeStyle = shieldRatio < 0.3 ? `rgba(255, 0, 0, ${0.4 + Math.sin(time*0.02)*0.3})` : 'rgba(34, 211, 238, 0.5)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20; ctx.shadowColor = shieldRatio < 0.3 ? '#f00' : '#0ff';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  }
  const sColor = SHIPS.find(s => s.type === stats.shipType)?.color || '#22d3ee';
  ctx.shadowBlur = 25; ctx.shadowColor = sColor;
  ctx.fillStyle = isHitActive ? '#ffffff' : sColor;
  ctx.beginPath();
  ctx.moveTo(0, -26); ctx.lineTo(-22, 22); ctx.lineTo(0, 12); ctx.lineTo(22, 22);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath(); ctx.ellipse(0, -5, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore(); 
  ctx.restore();
};
