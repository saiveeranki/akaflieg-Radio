
import React, { useState } from 'react';
import { RadioService } from '../types';

interface RadioPanelProps {
  isTransmitting: boolean;
  isReceiving: boolean;
  activeFrequency: string;
  setActiveFrequency: (freq: string) => void;
  onPttStart: () => void;
  onPttEnd: () => void;
}

export const RadioPanel: React.FC<RadioPanelProps> = ({ 
  isTransmitting, 
  isReceiving, 
  activeFrequency,
  setActiveFrequency,
  onPttStart, 
  onPttEnd
}) => {
  const [standbyFrequency, setStandbyFrequency] = useState('121.700');

  const handleFlip = () => {
    const oldActive = activeFrequency;
    setActiveFrequency(standbyFrequency);
    setStandbyFrequency(oldActive);
  };

  const tuneFrequency = (amount: number) => {
    let freq = parseFloat(standbyFrequency);
    freq += amount;
    
    // Aviation COM frequencies range from 118.000 to 136.975
    if (freq < 118.0) freq = 136.975;
    if (freq > 136.975) freq = 118.0;
    
    setStandbyFrequency(freq.toFixed(3));
  };

  const setPreset = (val: string) => {
    setStandbyFrequency(val);
  };

  return (
    <div className="bg-slate-900 border-4 border-slate-700 rounded-xl p-5 radio-glow max-w-md w-full mx-auto shadow-2xl">
      {/* Dual Frequency Display */}
      <div className="bg-black p-4 rounded-lg mb-6 border-2 border-slate-800 flex justify-between items-center relative overflow-hidden">
        <div className="flex-1">
          <span className="text-amber-500/50 text-[9px] block uppercase font-black tracking-widest mb-1">Active</span>
          <div className="text-amber-500 font-mono-aviation text-3xl tracking-tighter drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">
            {activeFrequency}
          </div>
        </div>

        <button 
          onClick={handleFlip}
          className="mx-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-full border border-slate-600 transition-transform active:rotate-180"
          title="Flip Frequencies"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        <div className="flex-1 text-right">
          <span className="text-slate-500 text-[9px] block uppercase font-black tracking-widest mb-1">Standby</span>
          <div className="text-slate-400 font-mono-aviation text-3xl tracking-tighter">
            {standbyFrequency}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="absolute top-2 right-2 flex gap-1">
          <div className={`w-2 h-2 rounded-full transition-all duration-75 ${isTransmitting ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-slate-900'}`}></div>
          <div className={`w-2 h-2 rounded-full transition-all duration-75 ${isReceiving ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-slate-900'}`}></div>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-slate-500 text-[9px] font-black uppercase block px-1 mb-2 tracking-widest">Quick Presets</label>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(RadioService).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setPreset(val as string)}
                  className={`text-left px-3 py-1.5 rounded text-[10px] font-bold transition-all border ${
                    standbyFrequency === val 
                      ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-lg' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {key} ({val})
                </button>
              ))}
            </div>
          </div>
          
          {/* Manual Tuning Knobs */}
          <div>
            <label className="text-slate-500 text-[9px] font-black uppercase block px-1 mb-2 tracking-widest">Manual Tuning</label>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[8px] text-slate-600 font-bold uppercase text-center">MHz</span>
                <div className="flex gap-1">
                  <button onClick={() => tuneFrequency(1)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded border border-slate-700">+</button>
                  <button onClick={() => tuneFrequency(-1)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded border border-slate-700">-</button>
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[8px] text-slate-600 font-bold uppercase text-center">kHz</span>
                <div className="flex gap-1">
                  <button onClick={() => tuneFrequency(0.025)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded border border-slate-700">+</button>
                  <button onClick={() => tuneFrequency(-0.025)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded border border-slate-700">-</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PTT Button Area */}
        <div className="flex flex-col items-center justify-center bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
          <button
            onMouseDown={onPttStart}
            onMouseUp={onPttEnd}
            onTouchStart={(e) => { e.preventDefault(); onPttStart(); }}
            onTouchEnd={(e) => { e.preventDefault(); onPttEnd(); }}
            className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all transform active:scale-90 select-none ${
              isTransmitting 
                ? 'border-red-500 bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                : 'border-slate-600 bg-slate-800 hover:border-slate-400 hover:bg-slate-700'
            }`}
          >
            <span className={`text-[10px] font-black mb-1 tracking-tighter ${isTransmitting ? 'text-white' : 'text-slate-500'}`}>
              TRANSMIT
            </span>
            <svg 
              className={`w-10 h-10 ${isTransmitting ? 'text-white' : 'text-slate-500'}`} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span className={`text-[8px] font-bold mt-1 ${isTransmitting ? 'text-red-200' : 'text-slate-600'}`}>
              (PTT)
            </span>
          </button>
          <div className="mt-4 flex flex-col items-center">
             <div className="flex gap-1 mb-1">
               <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
               <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
               <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
             </div>
             <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Comm 1 Audio</span>
          </div>
        </div>
      </div>
    </div>
  );
};
