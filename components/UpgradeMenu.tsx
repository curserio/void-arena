
import React from 'react';
import { Upgrade } from '../types';

interface UpgradeMenuProps {
  upgrades: Upgrade[];
  onSelect: (upgrade: Upgrade) => void;
}

const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ upgrades, onSelect }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[500] p-6">
      <div className="max-w-md w-full flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
        <div className="text-center">
          <h2 className="text-cyan-400 text-3xl font-black italic tracking-tighter uppercase">Level Up!</h2>
          <p className="text-slate-400 text-sm">Select an enhancement for your vessel</p>
        </div>

        <div className="flex flex-col gap-4">
          {upgrades.map((upgrade, idx) => (
            <button
              key={`${upgrade.id}-${idx}`}
              onClick={() => onSelect(upgrade)}
              className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-cyan-500 hover:bg-slate-800 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 group-hover:bg-cyan-900/30 group-hover:border-cyan-500 transition-colors">
                <i className={`fa-solid ${upgrade.icon} text-cyan-400 text-xl`} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">{upgrade.name}</h3>
                <p className="text-slate-400 text-sm leading-tight">{upgrade.description}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-chevron-right text-cyan-500" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpgradeMenu;
