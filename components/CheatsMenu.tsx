
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
            onClick={() => addCredits(10000)}
            className="group relative overflow-hidden py-6 bg-slate-950 border border-red-500/30 rounded-2xl text-red-500 font-black text-2xl uppercase transition-all active:scale-95 hover:bg-red-500/10 hover:border-red-500"
          >
            <div className="relative z-10 flex flex-col items-center">
              <span>Add 10,000 Credits</span>
              <span className="text-[10px] opacity-50 font-bold mt-1 tracking-widest">Injection Successful</span>
            </div>
          </button>

          <button 
            onClick={() => addCredits(100000)}
            className="group relative overflow-hidden py-4 bg-slate-950 border border-amber-500/30 rounded-2xl text-amber-500 font-black text-lg uppercase transition-all active:scale-95 hover:bg-amber-500/10 hover:border-amber-500"
          >
            Add 100,000 Credits
          </button>
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
