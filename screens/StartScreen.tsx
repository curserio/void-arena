import React from 'react';
import { GameDifficulty } from '../types';
import { DIFFICULTY_CONFIGS } from '../constants';

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
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-lg z-[200]">
            <h1 className="text-cyan-400 text-5xl font-black italic uppercase mb-2 drop-shadow-[0_0_40px_rgba(6,182,212,0.9)] text-center">
                Void Arena
            </h1>

            {bestScore > 0 && (
                <div className="mb-8 px-4 py-1 rounded bg-slate-900/50 border border-slate-700 text-amber-400 font-bold uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                    Best Score: {bestScore.toLocaleString()}
                </div>
            )}

            <button
                onClick={onOpenLeaderboard}
                className="absolute top-6 right-6 w-14 h-14 bg-slate-800 rounded-full border border-slate-700 text-amber-400 shadow-xl flex items-center justify-center hover:bg-slate-700 transition-all active:scale-95 z-[210]"
            >
                <i className="fa-solid fa-trophy text-2xl" />
            </button>

            {/* Difficulty Selection */}
            <div className="flex gap-2 mb-6 p-2 bg-slate-900/60 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
                {Object.values(DIFFICULTY_CONFIGS).map(diff => {
                    const isUnlocked = currentRank >= diff.minRank;
                    const isSelected = selectedDifficulty === diff.id;
                    return (
                        <button
                            key={diff.id}
                            disabled={!isUnlocked}
                            onClick={() => onSelectDifficulty(diff.id)}
                            className={`px-4 py-3 rounded-lg flex flex-col items-center min-w-[100px] transition-all relative
                ${isSelected ? 'bg-slate-800 border-2 shadow-lg scale-105 z-10' : 'bg-transparent border border-transparent opacity-60 hover:opacity-100'}
                ${!isUnlocked ? 'cursor-not-allowed opacity-30 grayscale' : ''}
              `}
                            style={{ borderColor: isSelected ? diff.color : 'transparent' }}
                        >
                            <div className="font-black text-sm uppercase tracking-widest" style={{ color: diff.color }}>
                                {diff.name}
                            </div>
                            {!isUnlocked && (
                                <div className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                    <i className="fa-solid fa-lock" /> Rank {diff.minRank}
                                </div>
                            )}
                            {isSelected && (
                                <div className="text-[9px] font-bold text-white mt-1">{diff.description}</div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 w-full max-w-xs mt-2">
                <button
                    onClick={onStartMission}
                    className="py-6 bg-cyan-500 text-slate-950 font-black text-2xl rounded-2xl active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
                >
                    START MISSION
                </button>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onOpenGarage}
                        className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95 transition-all"
                    >
                        GARAGE
                    </button>
                    <button
                        onClick={onOpenDebug}
                        className="py-4 bg-slate-900 text-emerald-400 font-black text-xl rounded-2xl border border-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-inner hover:bg-slate-800"
                    >
                        <i className="fa-solid fa-flask" /> SIM
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onOpenSettings}
                        className="py-3 bg-slate-900 text-slate-400 font-bold text-sm rounded-xl border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-gear" /> SETTINGS
                    </button>
                    <button
                        onClick={onOpenGuide}
                        className="py-3 bg-slate-900 text-slate-400 font-bold text-sm rounded-xl border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
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
            <div className="mt-12 text-amber-400 font-black text-xl flex items-center gap-2">
                <i className="fas fa-coins" />
                <span>{credits.toLocaleString()} CREDITS</span>
            </div>
            <div className="mt-2 text-cyan-400/60 font-bold text-sm uppercase tracking-widest">
                RANK: LV {currentRank}
            </div>

            <div className="absolute bottom-10 left-0 w-full text-center text-slate-600 font-bold text-xs tracking-widest opacity-50 z-[210] pointer-events-none">
                v0.4.0
            </div>
        </div>
    );
};

export default StartScreen;
