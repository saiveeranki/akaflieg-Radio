
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { FlightScenario, RadioService, TranscriptionEntry } from './types';
import { generateScenario, getSystemInstruction } from './services/geminiService';
import { RadioPanel } from './components/RadioPanel';
import { ScenarioCard } from './components/ScenarioCard';
import { AkafliegLogo } from './components/AkafliegLogo';
import { decode, encode, decodeAudioData, createPcmBlob } from './utils/audio-helpers';

const App: React.FC = () => {
  // State
  const [scenario, setScenario] = useState<FlightScenario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [activeFrequency, setActiveFrequency] = useState<string>('118.100');
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for Audio & Session
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionBufferRef = useRef<{ user: string; model: string }>({ user: '', model: '' });

  // Initialize Audio Contexts
  const initAudio = useCallback(() => {
    if (!inputAudioContextRef.current) {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    if (!outputAudioContextRef.current) {
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  }, []);

  // Connect to Gemini Live
  const connectToLive = useCallback(async (scenarioData: FlightScenario) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Radio Session Opened');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isTransmitting) {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsReceiving(true);
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsReceiving(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Transcriptions
            if (msg.serverContent?.inputTranscription) {
              transcriptionBufferRef.current.user += msg.serverContent.inputTranscription.text;
            }
            if (msg.serverContent?.outputTranscription) {
              transcriptionBufferRef.current.model += msg.serverContent.outputTranscription.text;
            }
            if (msg.serverContent?.turnComplete) {
              const userText = transcriptionBufferRef.current.user;
              const modelText = transcriptionBufferRef.current.model;
              
              if (userText) {
                setTranscriptions(prev => [...prev, { role: 'student', text: userText, timestamp: Date.now() }]);
              }
              if (modelText) {
                setTranscriptions(prev => [...prev, { role: 'atc', text: modelText, timestamp: Date.now() }]);
              }
              
              transcriptionBufferRef.current = { user: '', model: '' };
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsReceiving(false);
            }
          },
          onerror: (e) => {
            console.error('Radio Error:', e);
            setError('Radio link failed. Attempting to reconnect...');
          },
          onclose: () => console.log('Radio Session Closed')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: getSystemInstruction(scenarioData),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the radio tower. Check your microphone permissions.');
    }
  }, [isTransmitting]);

  // Load Scenario
  const loadNewScenario = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateScenario();
      setScenario(data);
      initAudio();
      await connectToLive(data);
    } catch (err) {
      setError('Failed to generate scenario. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [initAudio, connectToLive]);

  useEffect(() => {
    loadNewScenario();
  }, []);

  // PTT Handlers
  const handlePttStart = () => {
    if (!sessionRef.current) return;
    setIsTransmitting(true);
  };

  const handlePttEnd = () => {
    setIsTransmitting(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto">
      {/* Branded Header */}
      <header className="w-full flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-6">
          <AkafliegLogo className="w-12 h-12" />
          <div className="h-10 w-px bg-slate-800 hidden md:block" />
          <div className="hidden md:block">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">
              SkyTalk <span className="text-amber-500">Radio</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Official Simulator • Austrian ATC Integration</p>
          </div>
        </div>
        <button 
          onClick={loadNewScenario}
          className="bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase px-6 py-2.5 rounded transition-all active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
        >
          Generate New Mission
        </button>
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse tracking-widest uppercase text-xs">Akaflieg Graz Systems Check...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500 text-red-200 p-6 rounded-lg text-center max-w-md">
          <p className="font-bold mb-4">{error}</p>
          <button onClick={loadNewScenario} className="bg-red-500 text-white px-4 py-2 rounded text-sm font-bold">Retry Link</button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Flight Info */}
          <div className="lg:col-span-8 space-y-6">
            {scenario && <ScenarioCard scenario={scenario} />}
            
            {/* Communication Log */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 h-[450px] flex flex-col shadow-inner">
              <h3 className="text-slate-500 text-[10px] font-black uppercase mb-4 tracking-widest px-2 opacity-50 flex justify-between">
                <span>Radio Transcription Log</span>
                <span>Active Link: {activeFrequency} MHz</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-4 px-2 scroll-smooth">
                {transcriptions.length === 0 && (
                  <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">
                    No radio contact yet. Press PTT to initiate call on {activeFrequency}.
                  </div>
                )}
                {transcriptions.map((t, i) => (
                  <div key={i} className={`flex flex-col ${t.role === 'student' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-tighter">
                      {t.role === 'student' ? scenario?.callsign : 'ATC'} @ {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <div className={`max-w-[85%] px-4 py-2 rounded-lg text-sm font-mono-aviation leading-relaxed shadow-sm ${
                      t.role === 'student' 
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-tr-none' 
                        : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-none'
                    }`}>
                      {t.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Radio Stack Interface */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <RadioPanel 
              isTransmitting={isTransmitting}
              isReceiving={isReceiving}
              activeFrequency={activeFrequency}
              setActiveFrequency={setActiveFrequency}
              onPttStart={handlePttStart}
              onPttEnd={handlePttEnd}
            />
            
            <div className="mt-8 p-5 bg-slate-800/30 rounded-lg border border-slate-700 w-full">
              <h4 className="text-red-500 text-[10px] font-black uppercase mb-4 tracking-widest">Akaflieg Training Protocol</h4>
              <ul className="text-slate-400 text-[11px] space-y-3 leading-relaxed">
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black shrink-0">1</div>
                  <span>Set frequency in <span className="text-slate-200">STANDBY</span> then use the <span className="text-slate-200">FLIP (↔)</span> button to make it <span className="text-slate-200 font-bold uppercase">Active</span>.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black shrink-0">2</div>
                  <span>Listen to <span className="text-amber-500 italic font-bold">ATIS Broadcast</span> in the Mission Briefing to get current weather and conditions.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black shrink-0">3</div>
                  <span>Speak clearly and use <span className="text-slate-200 italic underline">Standard ICAO Phraseology</span> (e.g., "Request Taxi", "Cleared for Takeoff").</span>
                </li>
              </ul>
            </div>
            
            <footer className="mt-auto pt-8 text-center opacity-30">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SkyTalk x Akaflieg Graz</p>
              <p className="text-[8px] text-slate-600 mt-1">Powered by Gemini 2.5 Flash Native Audio</p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
