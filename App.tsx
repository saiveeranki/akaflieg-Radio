
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { FlightScenario, RadioService, TranscriptionEntry, ShowcaseStep, InteractiveShowcase } from './types';
import { generateScenario, getSystemInstruction, VFR_SHOWCASE_LIST, generateSpeech } from './services/geminiService';
import { RadioPanel } from './components/RadioPanel';
import { ScenarioCard } from './components/ScenarioCard';
import { AkafliegLogo } from './components/AkafliegLogo';
import { decode, encode, decodeAudioData, createPcmBlob } from './utils/audio-helpers';

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const App: React.FC = () => {
  // Global State
  const [scenario, setScenario] = useState<FlightScenario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [atcThinking, setAtcThinking] = useState<boolean>(false);
  const [activeFrequency, setActiveFrequency] = useState<string>('118.100');
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<'OFFLINE' | 'CONNECTING' | 'ONLINE'>('OFFLINE');
  const [needsKey, setNeedsKey] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [selectedVoice, setSelectedVoice] = useState<string>('Charon');
  
  // Showcase State
  const [isShowcase, setIsShowcase] = useState<boolean>(false);
  const [currentShowcase, setCurrentShowcase] = useState<InteractiveShowcase | null>(null);
  const [showcaseStepIndex, setShowcaseStepIndex] = useState<number>(0);
  const [showcaseCompleted, setShowcaseCompleted] = useState<boolean>(false);
  const [showcaseTranscript, setShowcaseTranscript] = useState<string>('');

  // Refs
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionBufferRef = useRef<{ user: string; model: string }>({ user: '', model: '' });
  const recognitionRef = useRef<any>(null);

  const initAudio = useCallback(() => {
    if (!inputAudioContextRef.current) inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    if (!outputAudioContextRef.current) outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }, []);

  // Initialize Speech Recognition for Demo Mode
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setShowcaseTranscript(prev => prev + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (isShowcase) setError("Microphone access denied or audio issue detected.");
      };

      recognitionRef.current = recognition;
    }
  }, [isShowcase]);

  const playAtcSpeech = async (text: string) => {
    setIsReceiving(true);
    try {
      const base64 = await generateSpeech(text, selectedVoice);
      if (!outputAudioContextRef.current) initAudio();
      const ctx = outputAudioContextRef.current!;
      if (ctx.state === 'suspended') await ctx.resume();
      const uint8 = decode(base64);
      const audioBuffer = await decodeAudioData(uint8, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsReceiving(false);
      source.start(0);
    } catch (e) {
      console.error("Speech failure", e);
      setIsReceiving(false);
    }
  };

  const connectToLive = useCallback(async (scenarioData: FlightScenario) => {
    setLinkStatus('CONNECTING');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLinkStatus('ONLINE');
            setError(null);
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const analyzer = inputAudioContextRef.current!.createAnalyser();
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const dataArray = new Uint8Array(analyzer.frequencyBinCount);
              analyzer.getByteFrequencyData(dataArray);
              let sum = 0; for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              setMicLevel(sum / dataArray.length);
              if ((window as any).__isTransmitting && !isShowcase) {
                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              }
            };
            source.connect(analyzer);
            analyzer.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (isShowcase) return; // Ignore live messages in showcase
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
            if (msg.serverContent?.inputTranscription) transcriptionBufferRef.current.user += msg.serverContent.inputTranscription.text;
            if (msg.serverContent?.outputTranscription) transcriptionBufferRef.current.model += msg.serverContent.outputTranscription.text;
            if (msg.serverContent?.turnComplete) {
              if (transcriptionBufferRef.current.user) setTranscriptions(prev => [...prev, { role: 'student', text: transcriptionBufferRef.current.user, timestamp: Date.now() }]);
              if (transcriptionBufferRef.current.model) setTranscriptions(prev => [...prev, { role: 'atc', text: transcriptionBufferRef.current.model, timestamp: Date.now() }]);
              transcriptionBufferRef.current = { user: '', model: '' };
            }
          },
          onerror: (e: any) => setLinkStatus('OFFLINE'),
          onclose: () => setLinkStatus('OFFLINE')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: getSystemInstruction(scenarioData),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) { setLinkStatus('OFFLINE'); }
  }, [selectedVoice, isShowcase]);

  useEffect(() => { (window as any).__isTransmitting = isTransmitting; }, [isTransmitting]);

  const loadNewScenario = useCallback(async () => {
    setLoading(true); setError(null); setNeedsKey(false); setIsShowcase(false); setTranscriptions([]);
    try {
      const data = await generateScenario();
      setScenario(data); initAudio(); await connectToLive(data);
    } catch (err) { setError('Systems check failed.'); } finally { setLoading(false); }
  }, [initAudio, connectToLive]);

  const loadShowcaseScenario = useCallback((sc: InteractiveShowcase) => {
    setCurrentShowcase(sc);
    setScenario(sc.scenario);
    setTranscriptions([]);
    setShowcaseStepIndex(0);
    setShowcaseCompleted(false);
    setShowcaseTranscript('');
    setLoading(false); setError(null); setLinkStatus('OFFLINE'); setNeedsKey(false);
    setIsShowcase(true);
    setActiveFrequency(sc.steps[0].frequency);
    initAudio();
  }, [initAudio]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        if (!await window.aistudio.hasSelectedApiKey()) { setNeedsKey(true); setLoading(false); return; }
      }
      loadNewScenario();
    };
    checkKey();
  }, []);

  const handlePttStart = async () => {
    if (inputAudioContextRef.current?.state === 'suspended') await inputAudioContextRef.current.resume();
    if (outputAudioContextRef.current?.state === 'suspended') await outputAudioContextRef.current.resume();
    setIsTransmitting(true);
    
    if (isShowcase && recognitionRef.current) {
      setShowcaseTranscript('');
      try { recognitionRef.current.start(); } catch(e) {}
    }
  };

  const handlePttEnd = async () => {
    setIsTransmitting(false);

    if (isShowcase && !showcaseCompleted && currentShowcase && showcaseStepIndex < currentShowcase.steps.length) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      
      setAtcThinking(true);

      // Give the speech recognition a moment to finalize
      setTimeout(async () => {
        const studentSaid = showcaseTranscript.trim();
        const step = currentShowcase.steps[showcaseStepIndex];
        
        // Mechanism: Understand input from microphone. If silence, prompt for readback.
        if (!studentSaid || studentSaid.length < 3) {
          setAtcThinking(false);
          const feedback = `${scenario?.callsign}, I did not receive your transmission, say again.`;
          setTranscriptions(prev => [...prev, { role: 'atc', text: feedback, timestamp: Date.now() }]);
          await playAtcSpeech(feedback);
          return;
        }

        // Logic check: Did they say something relevant? (Fuzzy check for callsign or key words)
        const relevant = studentSaid.toLowerCase().includes('oscar') || 
                         studentSaid.toLowerCase().includes('kag') || 
                         studentSaid.toLowerCase().includes('echo') ||
                         studentSaid.toLowerCase().includes('request');

        if (!relevant) {
          setAtcThinking(false);
          const feedback = `${scenario?.callsign}, negative phraseology, please read back correctly.`;
          setTranscriptions(prev => [...prev, { role: 'atc', text: feedback, timestamp: Date.now() }]);
          await playAtcSpeech(feedback);
          return;
        }

        // Success Path
        setTranscriptions(prev => [...prev, { role: 'student', text: studentSaid, timestamp: Date.now() }]);
        const nextIdx = showcaseStepIndex + 1;
        
        setAtcThinking(false);
        setTranscriptions(prev => [...prev, { role: 'atc', text: step.atcResponse, timestamp: Date.now() }]);
        await playAtcSpeech(step.atcResponse);
        
        if (nextIdx < currentShowcase.steps.length) {
          setShowcaseStepIndex(nextIdx);
          setActiveFrequency(currentShowcase.steps[nextIdx].frequency);
        } else {
          setShowcaseCompleted(true);
        }
      }, 1500);
    }
  };

  if (needsKey) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AkafliegLogo className="w-20 h-20 mb-8" />
        <h1 className="text-3xl font-black text-white mb-4 uppercase italic">Radio Authentication Required</h1>
        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">SkyTalk Live Radio requires a <strong>Paid API Key</strong> with billing enabled for real-time voice features.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => window.aistudio?.openSelectKey?.().then(loadNewScenario)} className="bg-red-500 hover:bg-red-600 text-white font-black px-8 py-4 rounded-xl shadow-2xl transition-all transform active:scale-95 uppercase tracking-widest">Select Paid API Key</button>
          <button onClick={() => loadShowcaseScenario(VFR_SHOWCASE_LIST[0])} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black px-8 py-4 rounded-xl transition-all uppercase tracking-widest border border-slate-700">Try VFR Demo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto">
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-800 pb-6 gap-6">
        <div className="flex items-center gap-6">
          <AkafliegLogo className="w-12 h-12" />
          <div className="h-10 w-px bg-slate-800 hidden md:block" />
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">SkyTalk <span className="text-amber-500">VFR</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Official Simulator • Akaflieg Graz</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
             <div className={`w-2 h-2 rounded-full ${linkStatus === 'ONLINE' ? 'bg-green-500 shadow-[0_0_8px_green]' : linkStatus === 'CONNECTING' ? 'bg-amber-500 animate-pulse' : isShowcase ? 'bg-blue-500' : 'bg-red-500'}`}></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isShowcase ? 'VFR SHOWCASE' : linkStatus}</span>
          </div>
          <button onClick={loadNewScenario} className="bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase px-6 py-2.5 rounded transition-all shadow-lg">Live Mission</button>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Initialising Simulator...</p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            
            {isShowcase && (
              <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl overflow-x-auto shadow-xl">
                <h3 className="text-slate-500 text-[10px] font-black uppercase mb-3 tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                   Training Module Selection
                </h3>
                <div className="flex gap-2 min-w-max pb-2">
                  {VFR_SHOWCASE_LIST.map((sc, i) => (
                    <button 
                      key={i} 
                      onClick={() => loadShowcaseScenario(sc)}
                      className={`px-4 py-2.5 rounded text-[10px] font-black uppercase transition-all border ${currentShowcase?.title === sc.title ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                      {sc.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {scenario && <ScenarioCard scenario={scenario} voice={selectedVoice} />}
            
            {isShowcase && !showcaseCompleted && currentShowcase && (
              <div className="bg-slate-900 border-2 border-amber-500/30 p-5 rounded-xl flex flex-col gap-3 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-1 rounded shadow-sm">STUDENT SCRIPT</div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{currentShowcase.steps[showcaseStepIndex].phase} • {currentShowcase.steps[showcaseStepIndex].frequency} MHz</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Step {showcaseStepIndex + 1}/{currentShowcase.steps.length}</div>
                </div>
                <p className="text-amber-200 font-mono-aviation text-lg tracking-tight italic leading-relaxed">
                  "{currentShowcase.steps[showcaseStepIndex].pilotPrompt}"
                </p>
                <div className="mt-2 text-[10px] text-amber-500/50 font-bold uppercase animate-pulse flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-amber-500 rounded-full pulse"></div>
                   Speak now: Microphone is listening...
                </div>
              </div>
            )}

            {showcaseCompleted && (
              <div className="bg-green-500/10 border-2 border-green-500/30 p-8 rounded-xl text-center space-y-4 shadow-2xl">
                 <div className="text-4xl">✈️</div>
                 <h2 className="text-2xl font-black text-white uppercase italic">Mission Success</h2>
                 <p className="text-slate-400 max-w-md mx-auto text-sm">You have successfully completed the <strong>{currentShowcase?.title}</strong> scenario. Your phraseology and frequency management were within standards.</p>
                 <button onClick={() => loadShowcaseScenario(currentShowcase!)} className="bg-green-500 text-slate-950 font-black px-8 py-3 rounded-lg text-sm uppercase tracking-widest hover:bg-green-400 transition-all">Restart Module</button>
              </div>
            )}

            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 h-[400px] flex flex-col shadow-inner relative">
              <h3 className="text-slate-500 text-[10px] font-black uppercase mb-4 tracking-widest px-2 opacity-50 flex justify-between">
                <span>Transcription Log</span>
                {isShowcase && <span className="text-blue-500 font-black">VOICE RECOGNITION ACTIVE</span>}
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-4">
                {transcriptions.length === 0 && !atcThinking && !isTransmitting && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
                    <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="italic text-xs tracking-widest uppercase">Awaiting Radio Transmission</p>
                  </div>
                )}
                {isTransmitting && isShowcase && (
                  <div className="flex flex-col items-end animate-pulse">
                    <span className="text-[10px] font-bold text-slate-600 mb-1 uppercase">TRANSMITTING...</span>
                    <div className="bg-amber-500/20 border border-amber-500/40 px-4 py-3 rounded-xl rounded-tr-none text-amber-500 italic text-sm">
                       {showcaseTranscript || 'Speak the script now...'}
                    </div>
                  </div>
                )}
                {transcriptions.map((t, i) => (
                  <div key={i} className={`flex flex-col animate-in slide-in-from-bottom-2 duration-300 ${t.role === 'student' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-tighter">{t.role === 'student' ? scenario?.callsign : 'ATC'}</span>
                    <div className={`max-w-[85%] px-4 py-3 rounded-xl text-sm font-mono-aviation leading-relaxed shadow-lg ${
                      t.role === 'student' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-none'
                    }`}>{t.text}</div>
                  </div>
                ))}
                {atcThinking && (
                  <div className="flex flex-col items-start animate-pulse">
                    <span className="text-[10px] font-bold text-slate-600 mb-1 uppercase">ATC</span>
                    <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl rounded-tl-none">
                       <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center">
            <RadioPanel 
              isTransmitting={isTransmitting}
              isReceiving={isReceiving || atcThinking}
              activeFrequency={activeFrequency}
              setActiveFrequency={setActiveFrequency}
              onPttStart={handlePttStart}
              onPttEnd={handlePttEnd}
              micLevel={micLevel}
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
            />
            
            <div className="mt-8 p-5 bg-slate-800/30 rounded-2xl border border-slate-700 w-full shadow-lg">
              <h4 className="text-red-500 text-[10px] font-black uppercase mb-4 tracking-[0.2em] flex items-center gap-2">
                 <span className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_red]"></span>
                 Simulator Protocol
              </h4>
              <ul className="text-slate-400 text-[11px] space-y-4">
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black shrink-0 shadow-sm">1</div>
                  <span className="leading-tight">Select a <strong>VFR situation</strong>. The system is listening for the <strong>OSCAR ECHO</strong> callsign.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black shrink-0 shadow-sm">2</div>
                  <span className="leading-tight">The ATC will **only respond** if you speak clearly while holding PTT.</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black shrink-0 shadow-sm">3</div>
                  <span className="leading-tight">In <strong>Live Mode</strong>, the AI understands full complex sentences and variables.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
