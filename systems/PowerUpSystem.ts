
import { PlayerStats, PowerUpConfig, PowerUpId } from '../types';

// Helper to apply a duration buff
const applyBuff = (stats: PlayerStats, id: PowerUpId, duration: number, time: number): PlayerStats => {
  return {
    ...stats,
    activeBuffs: {
      ...stats.activeBuffs,
      [id]: time + duration
    }
  };
};

export const POWER_UPS: Record<PowerUpId, PowerUpConfig> = {
  // --- OFFENSIVE ---
  OVERDRIVE: {
    id: 'OVERDRIVE',
    name: 'Overdrive',
    type: 'DURATION',
    duration: 8000,
    weight: 10,
    color: '#d946ef', // Fuchsia
    icon: 'fa-bolt-lightning',
    label: 'F',
    onPickup: (s, t) => applyBuff(s, 'OVERDRIVE', 8000, t)
  },
  OMNI: {
    id: 'OMNI',
    name: 'Omni Shot',
    type: 'DURATION',
    duration: 10000,
    weight: 8,
    color: '#fbbf24', // Amber
    icon: 'fa-arrows-split-up-and-left',
    label: 'M',
    onPickup: (s, t) => applyBuff(s, 'OMNI', 10000, t)
  },
  PIERCE: {
    id: 'PIERCE',
    name: 'Super Pierce',
    type: 'DURATION',
    duration: 7000,
    weight: 8,
    color: '#22d3ee', // Cyan
    icon: 'fa-ghost',
    label: 'P',
    onPickup: (s, t) => applyBuff(s, 'PIERCE', 7000, t)
  },

  // --- UTILITY / SURVIVAL ---
  SPEED: {
    id: 'SPEED',
    name: 'Nitro Boost',
    type: 'DURATION',
    duration: 6000,
    weight: 12,
    color: '#34d399', // Emerald
    icon: 'fa-forward-fast',
    label: 'S',
    onPickup: (s, t) => applyBuff(s, 'SPEED', 6000, t)
  },
  HEALTH: {
    id: 'HEALTH',
    name: 'Repair Kit',
    type: 'INSTANT',
    weight: 5, // Rare
    color: '#ef4444', // Red
    icon: 'fa-heart-pulse',
    label: '+',
    onPickup: (s) => ({
      ...s,
      currentHealth: Math.min(s.maxHealth, s.currentHealth + (s.maxHealth * 0.35)) // Heal 35%
    })
  },
  SHIELD: {
    id: 'SHIELD',
    name: 'Shield Battery',
    type: 'INSTANT',
    weight: 5, // Rare
    color: '#3b82f6', // Blue
    icon: 'fa-shield-virus',
    label: 'B',
    onPickup: (s) => ({
      ...s,
      currentShield: s.maxShield // Full Shield Restore
    })
  }
};

export const getWeightedRandomPowerUp = (): PowerUpId => {
  const items = Object.values(POWER_UPS);
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    if (random < item.weight) {
      return item.id;
    }
    random -= item.weight;
  }
  return 'OVERDRIVE'; // Fallback
};

export const isBuffActive = (stats: PlayerStats, id: PowerUpId, time: number): boolean => {
  const expiry = stats.activeBuffs[id];
  return expiry !== undefined && expiry > time;
};
