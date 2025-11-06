
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import type { LiveSession } from '@google/genai/dist/types/live-session';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audio';
import { MODELS, SYSTEM_INSTRUCTION } from '../constants';
import { TranscriptEntry } from '../types';

type ConnectionState = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

interface LiveViewProps {
    onApiKeyError: () => void;
}

const LiveView: React.FC<LiveViewProps> = ({ onApiKeyError }) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('IDLE');
    const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const stopSession = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        audioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);

        setConnectionState('IDLE');
    }, []);

    const startSession = useCallback(async () => {
        setConnectionState('CONNECTING');
        setTranscripts([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            sessionPromiseRef.current = ai.live.connect({
                model: MODELS.LIVE,
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: SYSTEM_INSTRUCTION,
                },
                callbacks: {
                    onopen: () => {
                        setConnectionState('CONNECTED');
                        
                        mediaStreamSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription?.text) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription?.text) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const userInput = currentInputTranscriptionRef.current.trim();
                            const modelOutput = currentOutputTranscriptionRef.current.trim();
                            
                            if(userInput || modelOutput) {
                                setTranscripts(prev => [...prev, { id: Date.now(), userInput, modelOutput }]);
                            }
                            
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            
                            source.onended = () => audioSourcesRef.current.delete(source);
                            audioSourcesRef.current.add(source);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        }

                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            for (const source of audioSourcesRef.current.values()) {
                                source.stop();
                                audioSourcesRef.current.delete(source);
                            }
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        if (e.message.includes('Requested entity was not found.')) {
                            onApiKeyError();
                        } else {
                            setConnectionState('ERROR');
                        }
                        stopSession();
                    },
                    onclose: () => {
                        setConnectionState('DISCONNECTED');
                    },
                }
            });

            await sessionPromiseRef.current; // Wait for connection to establish or fail.

        } catch (err) {
            console.error("Failed to start session:", err);
            if (err instanceof Error && err.message.includes('Requested entity was not found.')) {
              onApiKeyError();
              stopSession(); // Clean up any partial setup
              return;
            }
            setConnectionState('ERROR');
        }
    }, [stopSession, onApiKeyError]);

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);

    const isSessionActive = connectionState === 'CONNECTING' || connectionState === 'CONNECTED';

    const getStatusText = () => {
        switch (connectionState) {
            case 'IDLE': return 'Idle. Press Start to connect.';
            case 'CONNECTING': return 'Connecting to the Matrix...';
            case 'CONNECTED': return 'Connected. You may speak now.';
            case 'DISCONNECTED': return 'Disconnected.';
            case 'ERROR': return 'Connection error. Please try again.';
        }
    }

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto items-center">
            <div className="w-full text-center p-4 border-2 border-[#008F11] rounded-lg mb-6 shadow-[0_0_10px_rgba(0,255,65,0.3)]">
                <p className="text-lg">{getStatusText()}</p>
                <div className={`mt-2 h-1 w-full rounded-full bg-[#008F11] ${isSessionActive ? 'animate-pulse' : ''}`}></div>
            </div>
            
            <button
                onClick={isSessionActive ? stopSession : startSession}
                className={`px-8 py-4 border-2 rounded-full text-lg font-bold transition-all duration-300 flex items-center gap-3
                ${isSessionActive
                    ? 'bg-red-500 border-red-500 text-black hover:bg-red-600 shadow-[0_0_10px_rgba(255,80,80,0.5)]'
                    : 'bg-[#00FF41] border-[#00FF41] text-black hover:bg-green-400 shadow-[0_0_10px_rgba(0,255,65,0.5)]'
                }
                `}
            >
                {isSessionActive ? 'Disconnect' : 'Start Live Session'}
            </button>
            
            <div className="mt-6 w-full flex-grow border-2 border-[#008F11] rounded-lg p-4 bg-[#0D0D0D] overflow-y-auto matrix-scrollbar">
                {transcripts.length === 0 && <p className="text-center text-[#008F11]">Awaiting transmission...</p>}
                {transcripts.map((t) => (
                    <div key={t.id} className="mb-4 last:mb-0">
                        {t.userInput && <p><strong className="text-[#008F11]">YOU:</strong> {t.userInput}</p>}
                        {t.modelOutput && <p><strong className="text-[#00FF41]">ORACLE:</strong> {t.modelOutput}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveView;
