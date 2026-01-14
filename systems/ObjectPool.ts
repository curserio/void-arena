
import { Entity, EntityType } from '../types';

type Factory<T> = () => T;
type Reset<T> = (item: T) => void;

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: Factory<T>;
  private reset?: Reset<T>;

  constructor(factory: Factory<T>, reset?: Reset<T>) {
    this.factory = factory;
    this.reset = reset;
  }

  get(): T {
    if (this.pool.length > 0) {
      const item = this.pool.pop()!;
      if (this.reset) this.reset(item);
      return item;
    }
    return this.factory();
  }

  release(item: T) {
    this.pool.push(item);
  }
}

// Specific factories to keep code clean
export const createEntity = (): Entity => ({
  id: '',
  type: EntityType.BULLET, // Default
  pos: { x: 0, y: 0 },
  vel: { x: 0, y: 0 },
  radius: 0,
  health: 0,
  maxHealth: 0,
  color: '#fff'
});
