
import React, { useState } from 'react';
import { HighScoreEntry, GameDifficulty } from '../types';
import { DIFFICULTY_CONFIGS } from '../constants';

interface LeaderboardMenuProps {
  scores: HighScoreEntry[];
  onClose: () => void;
}

const LeaderboardMenu: React.FC<LeaderboardMenuProps> = ({ scores, onClose }) => {
  const [activeDiff, setActiveDiff] = useState<GameDifficulty>(GameDifficulty.NORMAL);

  const filteredScores = scores
    .filter(s => s.difficulty === activeDiff || (!s.difficulty && activeDiff === GameDifficulty.NORMAL))
    .slice(0, 50); // Limit total display

  const formatTime = (seconds?: number) => {
      if (!seconds) return '-';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[400] p-6 animate-in fade-in zoom-in duration-200">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh]">
        
        <div className="flex justify-between items-start mb-2">
            <div>
                <h2 className="text-amber-400 text-3xl font-black italic uppercase tracking-tighter">Hall of Fame</h2>
                <p className="text-slate-400 text-sm">Top commanders per operational tier</p>
            </div>
             <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition-colors border border-slate-700">
                <i className="fa-solid fa-times" />
             </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800 custom-scrollbar">
            {Object.values(DIFFICULTY_CONFIGS).map(config => {
                const isActive = activeDiff === config.id;
                return (
                    <button
                        key={config.id}
                        onClick={() => setActiveDiff(config.id)}
                        className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap border
                            ${isActive 
                                ? 'bg-slate-800 border-slate-600 text-white shadow-lg' 
                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                        style={{ color: isActive ? config.color : undefined, borderColor: isActive ? config.color : undefined }}
                    >
                        {config.name}
                    </button>
                );
            })}
        </div>

        {/* Table Container */}
        <div className="bg-slate-950/50 rounded-2xl border border-slate-800 flex-1 w-full min-h-0 overflow-hidden flex flex-col">
            
            {/* Horizontal Scroll Wrapper */}
            <div className="overflow-x-auto overflow-y-hidden flex-1 w-full custom-scrollbar">
                
                {/* Min Width Container ensures table structure holds */}
                <div className="min-w-[600px] h-full flex flex-col">
                    
                    {/* Header - Fixed at top relative to vertical scroll, moves with horizontal scroll */}
                    <div className="grid grid-cols-11 bg-slate-900/80 p-3 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-800 shrink-0">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-3">Pilot</div>
                        <div className="col-span-1 text-center">Time</div>
                        <div className="col-span-1 text-center">Acc</div>
                        <div className="col-span-2 text-center">Kills</div>
                        <div className="col-span-1 text-center">Credits</div>
                        <div className="col-span-2 text-right">Score</div>
                    </div>
                    
                    {/* Body - Vertically Scrollable */}
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        {filteredScores.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center gap-3">
                                <i className="fa-solid fa-ghost text-4xl text-slate-800" />
                                <div className="text-slate-600 font-bold uppercase text-xs">No Records Found for {DIFFICULTY_CONFIGS[activeDiff].name} Tier</div>
                            </div>
                        ) : (
                            filteredScores.map((entry, idx) => (
                                <div key={idx} className={`grid grid-cols-11 p-3 border-b border-slate-800/50 items-center hover:bg-slate-800/30 transition-colors ${idx === 0 ? 'bg-amber-400/5' : ''}`}>
                                    <div className="col-span-1 text-center font-black text-slate-600">
                                        {idx === 0 ? <i className="fa-solid fa-crown text-amber-400" /> : idx + 1}
                                    </div>
                                    <div className="col-span-3 truncate pr-2">
                                        <div className={`font-bold truncate ${idx === 0 ? 'text-amber-200' : 'text-white'}`}>{entry.name || 'Unknown Pilot'}</div>
                                        <div className="text-[9px] text-slate-500">{new Date(entry.date).toLocaleDateString()}</div>
                                    </div>
                                    <div className="col-span-1 text-center text-xs font-bold text-slate-300">
                                        {formatTime(entry.survivalTime)}
                                    </div>
                                    <div className="col-span-1 text-center text-xs font-bold text-slate-400">
                                        {entry.accuracy !== undefined ? `${entry.accuracy.toFixed(0)}%` : '-'}
                                    </div>
                                    <div className="col-span-2 text-center text-xs font-bold text-slate-400">
                                        {entry.enemiesKilled !== undefined ? entry.enemiesKilled.toLocaleString() : '-'}
                                    </div>
                                     <div className="col-span-1 text-center text-xs font-bold text-amber-400/70">
                                        {entry.creditsEarned !== undefined ? (entry.creditsEarned / 1000).toFixed(1) + 'k' : '-'}
                                    </div>
                                    <div className="col-span-2 text-right font-black text-cyan-400 tabular-nums">
                                        {entry.score.toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-slate-800 text-white font-black text-xl rounded-xl uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-slate-700 shrink-0"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LeaderboardMenu;
