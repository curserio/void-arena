/**
 * Garage Context
 * Shared state for all garage sub-components
 */

import React, { createContext, useContext, useMemo } from 'react';
import { PersistentData, MetaUpgrade, PlayerStats } from '../../types';

export interface GarageContextValue {
    data: PersistentData;
    totalCredits: number;
    sessionCredits: number;
    onUpdate: (newData: PersistentData, spentSession: number) => void;
    onApplyEffect?: (effect: (s: PlayerStats) => PlayerStats) => void;

    // Helpers
    getUpgradeCost: (upgrade: MetaUpgrade, currentLevel: number) => number;
    buyMeta: (upgrade: MetaUpgrade) => void;
    formatCredits: (num: number) => string;
}

const GarageContext = createContext<GarageContextValue | null>(null);

export const useGarage = (): GarageContextValue => {
    const ctx = useContext(GarageContext);
    if (!ctx) throw new Error('useGarage must be used within GarageProvider');
    return ctx;
};

interface GarageProviderProps {
    data: PersistentData;
    sessionCredits: number;
    onUpdate: (newData: PersistentData, spentSession: number) => void;
    onApplyEffect?: (effect: (s: PlayerStats) => PlayerStats) => void;
    children: React.ReactNode;
}

export const formatCredits = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num).toLocaleString();
};

export const GarageProvider: React.FC<GarageProviderProps> = ({
    data,
    sessionCredits,
    onUpdate,
    onApplyEffect,
    children
}) => {
    const totalCredits = useMemo(() => data.credits + sessionCredits, [data.credits, sessionCredits]);

    const getUpgradeCost = (upgrade: MetaUpgrade, currentLevel: number): number => {
        return Math.floor(upgrade.costBase * Math.pow(upgrade.costFactor, currentLevel));
    };

    const buyMeta = (upgrade: MetaUpgrade): void => {
        const currentLevel = data.metaLevels[upgrade.id] || 0;
        if (currentLevel >= upgrade.maxLevel) return;

        const cost = getUpgradeCost(upgrade, currentLevel);

        if (totalCredits >= cost) {
            const spentFromSession = Math.min(sessionCredits, cost);
            const newPersistentCredits = data.credits - (cost - spentFromSession);
            onUpdate(
                { ...data, credits: newPersistentCredits, metaLevels: { ...data.metaLevels, [upgrade.id]: currentLevel + 1 } },
                spentFromSession
            );
        }
    };

    const value: GarageContextValue = {
        data,
        totalCredits,
        sessionCredits,
        onUpdate,
        onApplyEffect,
        getUpgradeCost,
        buyMeta,
        formatCredits,
    };

    return (
        <GarageContext.Provider value={value}>
            {children}
        </GarageContext.Provider>
    );
};
