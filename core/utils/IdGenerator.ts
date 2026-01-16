/**
 * ID Generator
 * Generates unique IDs without string garbage from Math.random()
 * Uses simple incrementing counter with optional prefix
 */

export class IdGenerator {
    private counter: number = 0;
    private readonly prefix: string;

    constructor(prefix: string = '') {
        this.prefix = prefix;
    }

    /**
     * Generate unique ID
     * Format: "prefix-counter" or just "counter"
     */
    next(): string {
        return this.prefix ? `${this.prefix}-${this.counter++}` : `${this.counter++}`;
    }

    /**
     * Reset counter (useful for game restart)
     */
    reset(): void {
        this.counter = 0;
    }
}

// Pre-configured generators for different subsystems
export const particleIdGen = new IdGenerator('p');
export const projectileIdGen = new IdGenerator('b');
export const enemyIdGen = new IdGenerator('e');
export const pickupIdGen = new IdGenerator('PU');
export const generalIdGen = new IdGenerator('g');
