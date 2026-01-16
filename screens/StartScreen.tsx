import React, { useState } from 'react';
import { GameDifficulty } from '../types';
import { DIFFICULTY_CONFIGS } from '../constants';
import DifficultySelector from '../components/DifficultySelector';

interface StartScreenProps {
    bestScore: number;
    credits: number;
    currentRank: number;
    selectedDifficulty: GameDifficulty;
    onSelectDifficulty: (d: GameDifficulty) => void;
    onStartMission: () => void;
    onOpenGarage: () => void;
    onOpenDebug: () => void;
    onOpenSettings: () => void;
    onOpenGuide: () => void;
    onOpenCheats: () => void;
    onOpenLeaderboard: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({
    bestScore,
    credits,
    currentRank,
    selectedDifficulty,
    onSelectDifficulty,
    onStartMission,
    onOpenGarage,
    onOpenDebug,
    onOpenSettings,
    onOpenGuide,
    onOpenCheats,
    onOpenLeaderboard,
}) => {
    const [showDifficultySelector, setShowDifficultySelector] = useState(false);
    const selectedConfig = DIFFICULTY_CONFIGS[selectedDifficulty];

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-lg z-[200]">
            {/* Title */}
            <h1 className="text-cyan-400 text-4xl sm:text-5xl font-black italic uppercase mb-2 drop-shadow-[0_0_40px_rgba(6,182,212,0.9)] text-center px-4">
                Void Arena
            </h1>

            {/* Best Score */}
            {bestScore > 0 && (
                <div className="mb-6 px-4 py-1 rounded bg-slate-900/50 border border-slate-700 text-amber-400 font-bold uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                    Best Score: {bestScore.toLocaleString()}
                </div>
            )}

            {/* Leaderboard Button */}
            <button
                onClick={onOpenLeaderboard}
                className="absolute top-6 right-6 w-12 h-12 sm:w-14 sm:h-14 bg-slate-800 rounded-full border border-slate-700 text-amber-400 shadow-xl flex items-center justify-center hover:bg-slate-700 transition-all active:scale-95 z-[210]"
            >
                <i className="fa-solid fa-trophy text-xl sm:text-2xl" />
            </button>

            {/* Difficulty Button (opens popup) */}
            <button
                onClick={() => setShowDifficultySelector(true)}
                className="mb-6 px-6 py-3 bg-slate-800/80 border rounded-xl flex items-center gap-4 hover:bg-slate-700 transition-all active:scale-95"
                style={{ borderColor: selectedConfig.color }}
            >
                <div className="text-left">
                    <div className="text-slate-500 text-xs uppercase tracking-wider">
                        Mission Difficulty
                    </div>
                    <div
                        className="font-black text-lg uppercase tracking-wide"
                        style={{ color: selectedConfig.color }}
                    >
                        {selectedConfig.name}
                    </div>
                </div>
                <i className="fa-solid fa-chevron-down text-slate-500" />
            </button>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 w-full max-w-xs px-4">
                <button
                    onClick={onStartMission}
                    className="py-5 sm:py-6 bg-cyan-500 text-slate-950 font-black text-xl sm:text-2xl rounded-2xl active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
                >
                    START MISSION
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onOpenGarage}
                        className="py-3 sm:py-4 bg-slate-800 text-white font-black text-lg sm:text-xl rounded-2xl border border-slate-700 active:scale-95 transition-all"
                    >
                        GARAGE
                    </button>
                    <button
                        onClick={onOpenDebug}
                        className="py-3 sm:py-4 bg-slate-900 text-emerald-400 font-black text-lg sm:text-xl rounded-2xl border border-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-800"
                    >
                        <i className="fa-solid fa-flask" /> SIM
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onOpenSettings}
                        className="py-2.5 sm:py-3 bg-slate-900 text-slate-400 font-bold text-sm rounded-xl border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-gear" /> SETTINGS
                    </button>
                    <button
                        onClick={onOpenGuide}
                        className="py-2.5 sm:py-3 bg-slate-900 text-slate-400 font-bold text-sm rounded-xl border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-book" /> MANUAL
                    </button>
                </div>

                <button
                    onClick={onOpenCheats}
                    className="py-2 bg-transparent text-red-900/50 font-bold text-xs uppercase tracking-widest hover:text-red-500 hover:bg-slate-900 rounded-lg transition-all"
                >
                    <i className="fa-solid fa-code mr-2" />
                    Access Cheats
                </button>
            </div>

            {/* Footer Stats */}
            <div className="mt-10 sm:mt-12 text-amber-400 font-black text-lg sm:text-xl flex items-center gap-2">
                <i className="fas fa-coins" />
                <span>{credits.toLocaleString()} CREDITS</span>
            </div>
            <div className="mt-2 text-cyan-400/60 font-bold text-sm uppercase tracking-widest">
                RANK: LV {currentRank}
            </div>

            <div className="absolute bottom-8 sm:bottom-10 left-0 w-full text-center text-slate-600 font-bold text-xs tracking-widest opacity-50 z-[210] pointer-events-none">
                v0.5.0
            </div>

            {/* Difficulty Selector Modal */}
            <DifficultySelector
                isOpen={showDifficultySelector}
                selectedDifficulty={selectedDifficulty}
                currentRank={currentRank}
                onSelect={onSelectDifficulty}
                onClose={() => setShowDifficultySelector(false)}
            />
        </div>
    );
};

export default StartScreen;
