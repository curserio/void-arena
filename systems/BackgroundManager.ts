
import { WORLD_SIZE } from '../constants';

export interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  layer: number;
  opacity: number;
}

export const generateStars = (count: number): BackgroundStar[] => {
  const stars: BackgroundStar[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * WORLD_SIZE,
      y: Math.random() * WORLD_SIZE,
      size: 0.5 + Math.random() * 2,
      layer: Math.floor(Math.random() * 3),
      opacity: 0.1 + Math.random() * 0.7
    });
  }
  return stars;
};

export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vOX: number,
  vOY: number,
  stars: BackgroundStar[]
) => {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, width, height);

  stars.forEach(s => {
    // Parallax effect based on layers
    let sx = (s.x + vOX * [0.1, 0.2, 0.4][s.layer]) % width;
    let sy = (s.y + vOY * [0.1, 0.2, 0.4][s.layer]) % height;
    
    if (sx < 0) sx += width;
    if (sy < 0) sy += height;

    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = s.layer === 2 ? '#fff' : '#475569';
    ctx.beginPath();
    ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.globalAlpha = 1.0;

  // Subtle grid
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 400;
  for (let x = vOX % gridSize; x < width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = vOY % gridSize; y < height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
};
