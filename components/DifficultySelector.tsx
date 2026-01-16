/**
 * DifficultySelector
 * Popup modal for selecting game difficulty
 */

import React from 'react';
import { GameDifficulty, DifficultyConfig } from '../types';
import { DIFFICULTY_CONFIGS } from '../constants';

interface DifficultySelectorProps {
    isOpen: boolean;
    selectedDifficulty: GameDifficulty;
    currentRank: number;
    onSelect: (difficulty: GameDifficulty) => void;
    onClose: () => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
    isOpen,
    selectedDifficulty,
    currentRank,
    onSelect,
    onClose,
}) => {
    if (!isOpen) return null;

    const selectedConfig = DIFFICULTY_CONFIGS[selectedDifficulty];

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white text-xl font-black uppercase tracking-wider">
                        Select Difficulty
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <i className="fa-solid fa-times text-xl" />
                    </button>
                </div>

                {/* Difficulty Options */}
                <div className="flex flex-col gap-3">
                    {Object.values(DIFFICULTY_CONFIGS).map(diff => {
                        const isUnlocked = currentRank >= diff.minRank;
                        const isSelected = selectedDifficulty === diff.id;

                        return (
                            <button
                                key={diff.id}
                                disabled={!isUnlocked}
                                onClick={() => {
                                    onSelect(diff.id);
                                    onClose();
                                }}
                                className={`p-4 rounded-xl border-2 text-left transition-all
                                    ${isSelected
                                        ? 'bg-slate-800 shadow-lg'
                                        : 'bg-slate-900/50 hover:bg-slate-800/50'}
                                    ${!isUnlocked
                                        ? 'opacity-40 cursor-not-allowed grayscale'
                                        : ''}`}
                                style={{
                                    borderColor: isSelected ? diff.color : 'transparent'
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div
                                            className="font-black text-lg uppercase tracking-wide"
                                            style={{ color: diff.color }}
                                        >
                                            {diff.name}
                                        </div>
                                        <div className="text-slate-400 text-sm mt-1">
                                            {diff.description}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <i
                                            className="fa-solid fa-check text-xl"
                                            style={{ color: diff.color }}
                                        />
                                    )}

                                    {!isUnlocked && (
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <i className="fa-solid fa-lock" />
                                            <span>Rank {diff.minRank}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Current Selection Info */}
                <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">
                        Active Mission Parameters
                    </div>
                    <div className="flex items-center gap-4">
                        <div
                            className="text-2xl font-black"
                            style={{ color: selectedConfig.color }}
                        >
                            {selectedConfig.name}
                        </div>
                        <div className="text-slate-400 text-sm">
                            Loot ×{selectedConfig.lootMultiplier.toFixed(1)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DifficultySelector;
