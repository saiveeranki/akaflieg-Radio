
import React, { useState, useRef, useEffect } from 'react';
import { FlightScenario } from '../types';
import { generateAtisAudio } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio-helpers';

interface ScenarioCardProps {
  scenario: FlightScenario;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Clear cached buffer when ATIS changes (new scenario)
  useEffect(() => {
    audioBufferRef.current = null;
    if (isPlaying) {
      sourceRef.current?.stop();
      setIsPlaying(false);
    }
  }, [scenario.atis]);

  const handlePlayAtis = async () => {
    if (isPlaying) {
      sourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoadingAudio(true);
      
      // Initialize AudioContext if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      // Explicitly resume in case it's suspended (common in modern browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Generate or reuse audio buffer
      if (!audioBufferRef.current) {
        const base64 = await generateAtisAudio(scenario.atis);
        const uint8 = decode(base64);
        audioBufferRef.current = await decodeAudioData(uint8, audioContextRef.current, 24000, 1);
      }

      // Play the buffer
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      
      sourceRef.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play ATIS:", error);
      alert("Radio interference: Could not receive ATIS broadcast. Check your connection.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className="bg-slate-800 border-l-4 border-amber-500 p-6 rounded-r-lg shadow-xl mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-amber-500 font-bold text-xs uppercase tracking-widest mb-1">Mission Briefing</h2>
          <h1 className="text-2xl font-bold text-white">{scenario.callsign} - {scenario.aircraftType}</h1>
        </div>
        <span className="bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
          {scenario.currentPhase}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-slate-400 text-sm font-semibold mb-2">Location & Situation</h3>
          <p className="text-slate-200 leading-relaxed">{scenario.mission}</p>
          <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700 relative">
            <div className="flex justify-between items-center mb-1">
              <span className="text-amber-500 text-xs font-bold block">ATIS INFORMATION</span>
              <button 
                onClick={handlePlayAtis}
                disabled={isLoadingAudio}
                className={`p-1.5 rounded-full transition-all ${
                  isPlaying 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-slate-800 text-amber-500 hover:bg-slate-700'
                } disabled:opacity-50`}
                title={isPlaying ? "Stop Broadcast" : "Listen to ATIS Broadcast"}
              >
                {isLoadingAudio ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-slate-300 italic text-sm">"{scenario.atis}"</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-slate-400 text-sm font-semibold mb-2">Primary Objectives</h3>
          <ul className="space-y-2">
            {scenario.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                <span className="text-amber-500 mt-1">•</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
