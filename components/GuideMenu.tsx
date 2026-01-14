
import React, { useState } from 'react';
import { UPGRADES } from '../constants';

interface GuideMenuProps {
  onClose: () => void;
}

const GuideMenu: React.FC<GuideMenuProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'UPGRADES' | 'HELP'>('UPGRADES');

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[400] p-4 md:p-8 animate-in fade-in zoom-in duration-200">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-cyan-400 text-4xl font-black italic uppercase tracking-tighter">Database</h2>
            <div className="flex gap-4 mt-4">
              <button 
                onClick={() => setTab('UPGRADES')}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${tab === 'UPGRADES' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
              >
                Upgrades
              </button>
              <button 
                onClick={() => setTab('HELP')}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${tab === 'HELP' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
              >
                Help
              </button>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-red-500 transition-colors">
            <i className="fa-solid fa-times text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {tab === 'UPGRADES' ? (
            <div className="grid grid-cols-1 gap-4">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 px-1">Available System Enhancements</p>
              {UPGRADES.map((u) => (
                <div key={u.id} className="flex items-center gap-5 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl group hover:border-cyan-500/50 transition-all">
                  <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-cyan-400 border border-slate-800 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all">
                    <i className={`fa-solid ${u.icon} text-2xl`} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg uppercase tracking-tight">{u.name}</h3>
                    <p className="text-slate-400 text-sm leading-snug">{u.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-8 text-slate-300">
              <section>
                <h3 className="text-cyan-400 font-black uppercase text-sm mb-3">Controls</h3>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm">
                  <p><span className="text-white font-bold">Movement:</span> Use Right Stick / WASD / Arrows</p>
                  <p><span className="text-white font-bold">Aiming:</span> Use Left Stick / Mouse / Touch Screen</p>
                  <p><span className="text-white font-bold">Firing:</span> Automatic when aiming at enemies, or hold Trigger/Mouse Click</p>
                </div>
              </section>

              <section>
                <h3 className="text-cyan-400 font-black uppercase text-sm mb-3">Gameplay</h3>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3 text-sm">
                  <p>Survive endless waves of enemies in deep space. Collect <span className="text-cyan-400 font-bold italic">Neural XP Sync</span> gems to level up and acquire random upgrades.</p>
                  <p>Collect <span className="text-amber-400 font-bold italic">Credits</span> during missions to unlock permanent ship upgrades in the <span className="text-white font-bold">Command Garage</span>.</p>
                  <p>Watch out for <span className="text-red-500 font-bold italic">Elite Enemies</span> marked with a magenta glow—they are tougher but drop better loot.</p>
                </div>
              </section>

              <section>
                <h3 className="text-cyan-400 font-black uppercase text-sm mb-3">Ship Systems</h3>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3 text-sm">
                  <p><span className="text-emerald-400 font-bold">Integrity Hull:</span> Your primary health. If this reaches zero, mission ends.</p>
                  <p><span className="text-blue-400 font-bold">Plasma Shields:</span> Recharges after not taking damage for 3 seconds.</p>
                </div>
              </section>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full py-5 bg-cyan-500 text-slate-950 font-black text-xl rounded-2xl uppercase tracking-widest active:scale-95 transition-all shadow-lg"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
};

export default GuideMenu;
