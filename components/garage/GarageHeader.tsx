/**
 * GarageHeader
 * Header with title, credits display, and close button
 */

import React from 'react';
import { useGarage } from './GarageContext';

interface GarageHeaderProps {
    onClose: () => void;
}

export const GarageHeader: React.FC<GarageHeaderProps> = ({ onClose }) => {
    const { formatCredits, totalCredits } = useGarage();

    return (
        <div className="flex justify-between items-center">
            <div className="flex flex-col">
                <h2 className="text-cyan-400 text-2xl sm:text-3xl font-black italic uppercase tracking-tighter">
                    Command Garage
                </h2>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm bg-amber-400/10 px-4 py-1.5 rounded-lg border border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                        <i className="fa-solid fa-coins" />
                        <span>{formatCredits(totalCredits)} CREDITS</span>
                    </div>
                </div>
            </div>
            <button
                onClick={onClose}
                className="bg-cyan-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase shadow-lg shadow-cyan-600/30 active:scale-95 transition-all hover:bg-cyan-500 text-sm sm:text-base"
            >
                Resume
            </button>
        </div>
    );
};
