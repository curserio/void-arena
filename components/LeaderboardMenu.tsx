
import React from 'react';
import { HighScoreEntry } from '../types';

interface LeaderboardMenuProps {
  scores: HighScoreEntry[];
  onClose: () => void;
}

const LeaderboardMenu: React.FC<LeaderboardMenuProps> = ({ scores, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[400] p-6 animate-in fade-in zoom-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-amber-400 text-3xl font-black italic uppercase tracking-tighter">Hall of Fame</h2>
             <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition-colors">
                <i className="fa-solid fa-times" />
             </button>
        </div>

        <div className="bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="grid grid-cols-6 bg-slate-900/80 p-3 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-800">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-3">Pilot</div>
                <div className="col-span-2 text-right">Score</div>
            </div>
            <div className="flex flex-col">
                {scores.length === 0 ? (
                    <div className="p-8 text-center text-slate-600 font-bold uppercase text-xs">No Records Found</div>
                ) : (
                    scores.map((entry, idx) => (
                        <div key={idx} className={`grid grid-cols-6 p-3 border-b border-slate-800/50 items-center ${idx === 0 ? 'bg-amber-400/5' : ''}`}>
                            <div className="col-span-1 text-center font-black text-slate-600">
                                {idx === 0 ? <i className="fa-solid fa-crown text-amber-400" /> : idx + 1}
                            </div>
                            <div className="col-span-3">
                                <div className={`font-bold ${idx === 0 ? 'text-amber-200' : 'text-white'}`}>{entry.name || 'Unknown Pilot'}</div>
                                <div className="text-[9px] text-slate-500">{new Date(entry.date).toLocaleDateString()}</div>
                            </div>
                            <div className="col-span-2 text-right font-black text-cyan-400 tabular-nums">
                                {entry.score.toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-slate-800 text-white font-black text-xl rounded-xl uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LeaderboardMenu;
