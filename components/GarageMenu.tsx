/**
 * GarageMenu
 * Refactored main garage container component
 * Uses sub-components for each section
 */

import React, { useState } from 'react';
import { PersistentData, PlayerStats } from '../types';
import {
    GarageProvider,
    GarageHeader,
    GarageTabs,
    GarageTab,
    ShipSelector,
    WeaponSelector,
    ModuleSelector,
    CoreUpgrades
} from './garage';

interface GarageMenuProps {
    data: PersistentData;
    sessionCredits: number;
    onClose: () => void;
    onUpdate: (newData: PersistentData, spentSession: number) => void;
    onApplyEffect?: (effect: (s: PlayerStats) => PlayerStats) => void;
}

const GarageMenu: React.FC<GarageMenuProps> = ({
    data,
    sessionCredits,
    onClose,
    onUpdate,
    onApplyEffect
}) => {
    const [activeTab, setActiveTab] = useState<GarageTab>('SHIPS');

    return (
        <div className="garage-container fixed inset-0 bg-slate-950 flex flex-col z-[300] overflow-hidden">
            <GarageProvider
                data={data}
                sessionCredits={sessionCredits}
                onUpdate={onUpdate}
                onApplyEffect={onApplyEffect}
            >
                {/* Header Section */}
                <div className="shrink-0 p-4 sm:p-6 bg-slate-900 border-b border-slate-800">
                    <div className="max-w-7xl mx-auto">
                        <GarageHeader onClose={onClose} />
                        <GarageTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div
                    className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950"
                    style={{
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch',
                        touchAction: 'pan-y',
                    }}
                >
                    <div className="max-w-7xl mx-auto">
                        {activeTab === 'SHIPS' && <ShipSelector />}
                        {activeTab === 'WEAPONS' && <WeaponSelector />}
                        {activeTab === 'MODULES' && <ModuleSelector />}
                        {activeTab === 'CORE' && <CoreUpgrades />}
                    </div>
                </div>
            </GarageProvider>
        </div>
    );
};

export default GarageMenu;
