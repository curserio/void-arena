
import React from 'react';
import { Upgrade } from '../types';

interface UpgradesListProps {
  acquired: Upgrade[];
  onClose: () => void;
}

const UpgradesList: React.FC<UpgradesListProps> = ({ acquired, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-cyan-400 text-2xl font-black italic uppercase">System Manifest</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
             <i className="fa-solid fa-times text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {acquired.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest">
              No upgrades acquired
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {acquired.map((u, i) => (
                <div key={`${u.id}-${i}`} className="flex items-center gap-4 p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-cyan-400 border border-slate-800">
                    <i className={`fa-solid ${u.icon}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm uppercase tracking-tight">{u.name}</h3>
                    <p className="text-slate-500 text-[10px]">{u.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full py-4 bg-cyan-600 text-white font-black rounded-xl uppercase tracking-widest active:scale-95 transition-all shadow-lg"
        >
          Close Manifest
        </button>
      </div>
    </div>
  );
};

export default UpgradesList;
