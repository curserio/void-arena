
import { WORLD_SIZE } from '../../constants';

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

  // Group stars by layer for batch rendering
  const layers = [[], [], []] as BackgroundStar[][];
  stars.forEach(s => layers[s.layer].push(s));

  const speeds = [0.1, 0.2, 0.4];
  const colors = ['#475569', '#475569', '#fff']; // Layers 0,1 are grey, 2 is white

  layers.forEach((layerStars, i) => {
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    layerStars.forEach(s => {
      let sx = (s.x + vOX * speeds[i]) % width;
      let sy = (s.y + vOY * speeds[i]) % height;
      if (sx < 0) sx += width;
      if (sy < 0) sy += height;

      ctx.globalAlpha = s.opacity;
      ctx.moveTo(sx, sy);
      // Use tiny rects for small stars for performance, arcs for big ones?
      // Actually, just using one big path with moveTo/arc is better than many fills.
      // But arc add points.
      // Let's use Rects for everything <= 1.5 size (most stars)
      if (s.size <= 1.5) {
        ctx.rect(sx - s.size, sy - s.size, s.size * 2, s.size * 2);
      } else {
        ctx.moveTo(sx + s.size, sy);
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      }
    });
    ctx.fill();
  });

  ctx.globalAlpha = 1.0;

  // Subtle grid
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 400;
  ctx.beginPath();
  for (let x = vOX % gridSize; x < width; x += gridSize) {
    ctx.moveTo(x, 0); ctx.lineTo(x, height);
  }
  for (let y = vOY % gridSize; y < height; y += gridSize) {
    ctx.moveTo(0, y); ctx.lineTo(width, y);
  }
  ctx.stroke();
};
