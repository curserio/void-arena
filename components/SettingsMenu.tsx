
import React, { useState } from 'react';
import { ControlScheme, PersistentData } from '../types';
import { ZOOM_PRESETS, DEFAULT_ZOOM } from '../constants';

interface SettingsMenuProps {
  data: PersistentData;
  onUpdate: (newData: PersistentData) => void;
  onReset: () => void;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ data, onUpdate, onReset, onClose }) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const currentScheme = data.settings?.controlScheme || ControlScheme.TWIN_STICK;
  const currentZoom = data.settings?.zoomLevel || DEFAULT_ZOOM;

  const setScheme = (scheme: ControlScheme) => {
    onUpdate({
      ...data,
      settings: {
        ...data.settings,
        controlScheme: scheme
      }
    });
  };

  const setZoom = (zoom: number) => {
    onUpdate({
      ...data,
      settings: {
        ...data.settings,
        zoomLevel: zoom
      }
    });
  };

  const handleResetClick = () => {
    if (confirmReset) {
      onReset();
    } else {
      setConfirmReset(true);
      // Auto-reset confirmation state after 3 seconds if not clicked
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[300] p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center">
          <h2 className="text-cyan-400 text-3xl font-black italic uppercase tracking-tighter">System Config</h2>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Fire Control Systems</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => setScheme(ControlScheme.TWIN_STICK)}
              className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${currentScheme === ControlScheme.TWIN_STICK ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'}`}
            >
               <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${currentScheme === ControlScheme.TWIN_STICK ? 'border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-600'}`}>
                 <i className="fa-solid fa-gamepad text-xl" />
               </div>
               <div className="text-left">
                 <div className={`font-black uppercase text-sm ${currentScheme === ControlScheme.TWIN_STICK ? 'text-white' : 'text-slate-400'}`}>Twin Stick</div>
                 <div className="text-[10px] text-slate-500 leading-tight mt-1">
                   Left Stick: Aim & Fire<br/>Right Stick: Movement
                 </div>
               </div>
            </button>

            <button 
              onClick={() => setScheme(ControlScheme.TAP_TO_AIM)}
              className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${currentScheme === ControlScheme.TAP_TO_AIM ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'}`}
            >
               <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${currentScheme === ControlScheme.TAP_TO_AIM ? 'border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-600'}`}>
                 <i className="fa-solid fa-fingerprint text-xl" />
               </div>
               <div className="text-left">
                 <div className={`font-black uppercase text-sm ${currentScheme === ControlScheme.TAP_TO_AIM ? 'text-white' : 'text-slate-400'}`}>Touch Targeting</div>
                 <div className="text-[10px] text-slate-500 leading-tight mt-1">
                   Tap/Hold Screen: Aim & Fire<br/>Right Stick: Movement
                 </div>
               </div>
            </button>

            <button 
              onClick={() => setScheme(ControlScheme.KEYBOARD_MOUSE)}
              className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${currentScheme === ControlScheme.KEYBOARD_MOUSE ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'}`}
            >
               <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${currentScheme === ControlScheme.KEYBOARD_MOUSE ? 'border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-600'}`}>
                 <i className="fa-solid fa-computer-mouse text-xl" />
               </div>
               <div className="text-left">
                 <div className={`font-black uppercase text-sm ${currentScheme === ControlScheme.KEYBOARD_MOUSE ? 'text-white' : 'text-slate-400'}`}>Keyboard & Mouse</div>
                 <div className="text-[10px] text-slate-500 leading-tight mt-1">
                   Mouse: Aim (Click/Toggle to Fire)<br/>WASD/Arrows: Movement
                 </div>
               </div>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
           <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Camera Optic</h3>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ZOOM_PRESETS.map((preset) => {
                  const isActive = Math.abs(currentZoom - preset.value) < 0.01;
                  return (
                      <button
                        key={preset.value}
                        onClick={() => setZoom(preset.value)}
                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2
                             ${isActive ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'}`}
                      >
                         <i className={`fa-solid ${preset.icon} text-lg ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                         <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-white' : 'text-slate-500'}`}>{preset.label}</span>
                      </button>
                  );
              })}
           </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-800 pt-6">
           <h3 className="text-red-500 text-xs font-bold uppercase tracking-widest px-1">Danger Zone</h3>
           <button 
             onClick={handleResetClick}
             className={`p-4 rounded-xl border transition-all flex items-center justify-center gap-2 font-black uppercase text-xs 
               ${confirmReset 
                 ? 'bg-red-600 text-white border-red-500 scale-105 shadow-xl animate-pulse' 
                 : 'bg-red-950/20 text-red-500 border-red-900/50 hover:bg-red-900/40 hover:border-red-500/50'
               }`}
           >
             <i className={`fa-solid ${confirmReset ? 'fa-exclamation-circle' : 'fa-trash'}`} />
             {confirmReset ? "CONFIRM RESET? (TAP AGAIN)" : "RESET PROGRESS"}
           </button>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-white text-slate-950 font-black text-xl rounded-xl uppercase tracking-widest active:scale-95 transition-all shadow-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SettingsMenu;
