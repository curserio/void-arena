
import React from 'react';
import { PersistentData } from '../types';

interface CheatsMenuProps {
  data: PersistentData;
  onUpdate: (newData: PersistentData) => void;
  onClose: () => void;
}

const CheatsMenu: React.FC<CheatsMenuProps> = ({ data, onUpdate, onClose }) => {
  const addCredits = (amount: number) => {
    onUpdate({
      ...data,
      credits: data.credits + amount
    });
  };

  const [customAmount, setCustomAmount] = React.useState(1000000);

  const formatCredits = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(0) + 'M';
    return num.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[400] p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-red-900/50 rounded-3xl p-8 shadow-2xl flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h2 className="text-red-500 text-3xl font-black italic uppercase tracking-tighter">Debug Console</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <i className="fa-solid fa-times text-xl" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center">Authorization Level: OMNI</p>

          <button
            onClick={() => addCredits(100000)}
            className="group relative overflow-hidden py-4 bg-slate-950 border border-red-500/30 rounded-2xl text-red-500 font-black text-xl uppercase transition-all active:scale-95 hover:bg-red-500/10 hover:border-red-500"
          >
            <div className="relative z-10 flex flex-col items-center">
              <span>Add 100,000 Credits</span>
            </div>
          </button>

          <div className="flex flex-col gap-4 bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
            <label className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Custom Amount: {customAmount.toLocaleString()} C</label>
            <input
              type="range"
              min="1000000"
              max="1000000000"
              step="1000000"
              value={customAmount}
              onChange={(e) => setCustomAmount(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <button
              onClick={() => addCredits(customAmount)}
              className="w-full py-3 bg-emerald-900/50 text-emerald-400 font-bold uppercase text-sm rounded-lg border border-emerald-500/50 hover:bg-emerald-500 hover:text-slate-950 transition-colors"
            >
              Add {formatCredits(customAmount)}
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
          <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Current Bank</div>
          <div className="text-white font-black text-2xl tabular-nums">{data.credits.toLocaleString()} C</div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 bg-red-600 text-white font-black text-xl rounded-xl uppercase tracking-widest active:scale-95 transition-all shadow-lg"
        >
          Exit Debug
        </button>
      </div>
    </div>
  );
};

export default CheatsMenu;
