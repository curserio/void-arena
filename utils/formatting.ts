
/**
 * Formatting utilities
 */

// Helper for formatting time (Seconds -> MM:SS)
export const formatSurvivalTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};
