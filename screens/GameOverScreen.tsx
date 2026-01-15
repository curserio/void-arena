
import React from 'react';
import { GameMode, PlayerStats, RunMetrics } from '../types';
import { formatSurvivalTime } from '../utils/formatting';

interface GameOverScreenProps {
    score: number;
    gameMode: GameMode;
    pendingHighScore: { score: number, rank: number } | null;
    hasSubmittedScore: boolean;
    newHighScoreName: string;
    onNameChange: (s: string) => void;
    onSubmitScore: () => void;
    runMetrics: RunMetrics;
    gameTime: number;
    stats: PlayerStats;
    onReturnToBase: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
    score,
    gameMode,
    pendingHighScore,
    hasSubmittedScore,
    newHighScoreName,
    onNameChange,
    onSubmitScore,
    runMetrics,
    gameTime,
    stats,
    onReturnToBase
}) => {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-2xl z-[200] p-6 animate-in fade-in duration-500">
            <h2 className="text-white text-5xl font-black uppercase mb-6 italic tracking-tighter text-center">Mission Failed</h2>

            <div className="flex gap-8 w-full max-w-4xl justify-center items-start">

                {/* Left Col: High Score / Score */}
                <div className="flex-1 flex flex-col items-center max-w-md">
                    {!hasSubmittedScore && pendingHighScore && gameMode === GameMode.STANDARD ? (
                        <div className="w-full bg-slate-900 border border-amber-500 rounded-2xl p-6 mb-6 flex flex-col gap-4">
                            <div className="text-center">
                                <div className="text-amber-400 font-black text-xl uppercase tracking-widest mb-1">New High Score!</div>
                                <div className="text-white text-4xl font-black tabular-nums">{pendingHighScore.score.toLocaleString()}</div>
                                <div className="text-slate-400 text-xs font-bold uppercase mt-1">Rank #{pendingHighScore.rank}</div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Enter Pilot Name</label>
                                <input
                                    type="text"
                                    value={newHighScoreName}
                                    onChange={(e) => onNameChange(e.target.value)}
                                    maxLength={12}
                                    className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold text-center uppercase focus:border-cyan-500 outline-none"
                                />
                            </div>

                            <button onClick={onSubmitScore} className="w-full py-4 bg-amber-500 text-slate-950 font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 active:scale-95 transition-all">
                                Register Score
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center mb-8">
                            {gameMode === GameMode.DEBUG && (
                                <div className="mb-4 px-4 py-1 bg-emerald-900/50 border border-emerald-500/50 rounded text-emerald-400 font-bold uppercase tracking-widest text-xs">
                                    Simulation Mode
                                </div>
                            )}
                            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total Score</div>
                            <div className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                                {score.toLocaleString()}
                            </div>
                        </div>
                    )}

                    {/* Run Stats */}
                    <div className="w-full grid grid-cols-2 gap-2 mb-6">
                        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Accuracy</div>
                            <div className="text-cyan-400 font-black text-lg">{(runMetrics.shotsFired > 0 ? (runMetrics.shotsHit / runMetrics.shotsFired * 100) : 0).toFixed(1)}%</div>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Enemies Killed</div>
                            <div className="text-red-500 font-black text-lg">{runMetrics.enemiesKilled.toLocaleString()}</div>
                        </div>
                        {/* Survival Time Stat */}
                        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 flex flex-col items-center col-span-2">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Survival Time</div>
                            <div className="text-white font-black text-lg">{formatSurvivalTime(gameTime)}</div>
                        </div>
                    </div>

                    {gameMode === GameMode.STANDARD && (
                        <div className="bg-amber-400/10 border border-amber-400/30 px-8 py-3 rounded-xl text-amber-400 font-black text-xl mb-8 flex items-center gap-3 w-full justify-center">
                            <i className="fa-solid fa-coins" />
                            <span>Salvage: +{Math.floor(stats.credits)} C</span>
                        </div>
                    )}

                    <button onClick={onReturnToBase} className="w-full py-5 bg-white text-red-900 font-black text-2xl rounded-full shadow-2xl active:scale-95 transition-all hover:bg-slate-200">RETURN TO BASE</button>
                </div>

                {/* Right Col: Combat Log */}
                <div className="w-full max-w-xs bg-slate-900/50 border border-red-900/30 rounded-2xl p-4 flex flex-col gap-2 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2 text-red-500 border-b border-red-900/30 pb-2">
                        <i className="fa-solid fa-triangle-exclamation" />
                        <span className="font-black uppercase text-sm tracking-widest">System Failure Log</span>
                    </div>

                    {stats.combatLog.length === 0 ? (
                        <div className="text-slate-500 text-xs italic text-center py-4">No damage recorded.</div>
                    ) : (
                        stats.combatLog.slice().reverse().map((entry, idx) => (
                            <div key={idx} className={`p-2 rounded flex justify-between items-center text-xs ${entry.isFatal ? 'bg-red-500/20 border border-red-500' : 'bg-slate-950/50 border border-slate-800'}`}>
                                <div>
                                    <div className="font-bold text-slate-300">{entry.source} {entry.enemyLevel ? `(LV ${entry.enemyLevel})` : ''}</div>
                                    {entry.isFatal && <div className="text-[9px] text-red-400 font-black uppercase tracking-wider">CRITICAL FAILURE</div>}
                                </div>
                                <div className="font-black text-red-400">-{entry.damage} HP</div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default GameOverScreen;
