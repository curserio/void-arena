import { Vector2D } from '../../types';
import { WORLD_SIZE } from '../../constants';

export interface ISpatialObject {
  pos: Vector2D;
}

export class SpatialHashGrid<T extends ISpatialObject> {
  private cellSize: number;
  private cols: number;
  private rows: number;
  // Using a flat array of arrays for buckets is faster than a Map in hot paths for JS engines
  private buckets: T[][];

  constructor(cellSize: number = 250) { // 250 covers most large enemies + movement
    this.cellSize = cellSize;
    this.cols = Math.ceil(WORLD_SIZE / cellSize);
    this.rows = Math.ceil(WORLD_SIZE / cellSize);
    this.buckets = new Array(this.cols * this.rows).fill(null).map(() => []);
  }

  // Clear buckets without allocating new arrays to reduce GC
  clear() {
    for (let i = 0; i < this.buckets.length; i++) {
      if (this.buckets[i].length > 0) {
        this.buckets[i].length = 0;
      }
    }
  }

  private getIndex(x: number, y: number): number {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    // Clamp to world bounds
    const c = Math.max(0, Math.min(this.cols - 1, col));
    const r = Math.max(0, Math.min(this.rows - 1, row));

    return c + r * this.cols;
  }

  insert(entity: T) {
    // Safety check: If physics broke and coords are NaN, skip to prevent Grid crash
    if (!Number.isFinite(entity.pos.x) || !Number.isFinite(entity.pos.y)) {
      return;
    }

    const index = this.getIndex(entity.pos.x, entity.pos.y);
    if (this.buckets[index]) {
      this.buckets[index].push(entity);
    }
  }

  // Retrieve potential candidates from the entity's cell and 8 neighbors
  retrieve(pos: Vector2D): T[] {
    const candidates: T[] = [];

    // Safety check
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
      return candidates;
    }

    const col = Math.floor(pos.x / this.cellSize);
    const row = Math.floor(pos.y / this.cellSize);

    // Check 3x3 grid around the entity
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const c = col + i;
        const r = row + j;

        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
          const index = c + r * this.cols;
          const bucket = this.buckets[index];
          // Use for loop for speed instead of spread/concat
          for (let k = 0; k < bucket.length; k++) {
            candidates.push(bucket[k]);
          }
        }
      }
    }

    return candidates;
  }
}
