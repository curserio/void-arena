import { Entity, EntityType } from '../../types';
import { generalIdGen } from './IdGenerator';

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
export const createEntity = (type: EntityType = EntityType.BULLET): Entity => {
  return {
    id: generalIdGen.next(),
    type,
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    radius: 5,
    health: 1,
    maxHealth: 1,
    color: '#fff',
    isAlive: true
  };
};
