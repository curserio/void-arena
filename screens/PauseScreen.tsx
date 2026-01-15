
import React from 'react';

interface PauseScreenProps {
    onResume: () => void;
    onOpenGarage: () => void;
    onOpenStatus: () => void;
    onOpenManifest: () => void;
    onOpenManual: () => void;
    onOpenSettings: () => void;
    onOpenCheats: () => void;
    onExit: () => void;
}

const PauseScreen: React.FC<PauseScreenProps> = ({
    onResume,
    onOpenGarage,
    onOpenStatus,
    onOpenManifest,
    onOpenManual,
    onOpenSettings,
    onOpenCheats,
    onExit
}) => {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-2xl z-[250]">
            <h2 className="text-white text-5xl font-black italic uppercase mb-12">Paused</h2>
            <div className="flex flex-col gap-4 w-full max-w-xs px-6">
                <button onClick={onResume} className="py-6 bg-cyan-500 text-slate-950 font-black text-2xl rounded-2xl active:scale-95 shadow-xl">RESUME</button>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={onOpenGarage} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">GARAGE</button>
                    <button onClick={onOpenStatus} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">STATUS</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={onOpenManifest} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">MANIFEST</button>
                    <button onClick={onOpenManual} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl border border-slate-700 active:scale-95">MANUAL</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={onOpenSettings} className="py-3 bg-slate-900 text-slate-400 font-bold text-sm rounded-xl border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <i className="fa-solid fa-gear" /> SETTINGS
                    </button>
                    <button onClick={onOpenCheats} className="py-3 bg-slate-950 text-red-900 font-bold text-sm rounded-xl border border-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <i className="fa-solid fa-code" /> CHEATS
                    </button>
                </div>

                <button onClick={onExit} className="py-4 bg-red-900/50 text-white font-black text-xl rounded-2xl border border-red-500/30 active:scale-95 mt-4">SAVE & EXIT</button>
            </div>
        </div>
    );
};

export default PauseScreen;
