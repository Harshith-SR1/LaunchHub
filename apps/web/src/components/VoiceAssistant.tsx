'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, X, MessageSquare, ShieldAlert } from 'lucide-react';
import { aiApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

// ElevenLabs Keys provided by user
const ELEVENLABS_API_KEY = 'sk_04e52a4cc7267c494296e3b2491c005e214c19e50c430177';
const ELEVENLABS_VOICE_ID = 'uIZsnBL0YK1S5j69bAih';

export default function VoiceAssistant() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Web Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-IN'; // Indian-English locale context

        rec.onstart = () => {
          setIsListening(true);
          setErrorMsg('');
        };

        rec.onresult = async (event: any) => {
          const resultText = event.results[0][0].transcript;
          setTranscript(resultText);
          setIsListening(false);
          await processVoiceQuery(resultText);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setErrorMsg('Microphone access blocked. Please enable permissions.');
          } else {
            setErrorMsg('Speech recognition failed. Try again.');
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
    setMounted(true);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startListening = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
    if (recognitionRef.current) {
      setTranscript('');
      setResponse('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
      }
    } else {
      setErrorMsg('Web Speech API is not supported in this browser.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceQuery = async (queryText: string) => {
    setIsProcessing(true);
    try {
      // Send speech query to Venture Navigator search engine
      const searchData = await aiApi.searchNavigator(queryText);
      
      // Build a narrative spoken response summarizing the match results
      let spokenSummary = '';
      if (searchData.intent) {
        const domainsCount = searchData.recommendedDomains?.length || 0;
        const appsCount = searchData.recommendedApps?.length || 0;
        const vcsCount = searchData.recommendedInvestors?.length || 0;
        
        spokenSummary = `I detected your intent to build a ${searchData.intent} startup. ` +
                        `I found ${domainsCount} matching domains, ${appsCount} apps, and ${vcsCount} investors. ` +
                        `Your readiness score is estimated at ${searchData.readinessScore || 85} percent, with a launch timeline of ${searchData.launchTime || '30 days'}.`;
      } else {
        spokenSummary = "I found matching domains and talent. You can review them in the console cards.";
      }
      
      setResponse(spokenSummary);
      await speakResponse(spokenSummary);
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Failed to process search query.');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (textToSpeak: string) => {
    setIsSpeaking(true);
    try {
      // Call ElevenLabs Text-to-Speech API
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: textToSpeak,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75
          }
        })
      });

      if (!res.ok) {
        throw new Error('ElevenLabs TTS request failed.');
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        setErrorMsg('Audio playback failed.');
      };

      await audio.play();
    } catch (e) {
      console.error('ElevenLabs synthesis failed, falling back to Web Speech synthesis:', e);
      // Fallback to native Web Speech API synthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-IN';
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
        setErrorMsg('Voice synthesis is not supported.');
      }
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating Microphone Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all ${
            isOpen ? 'bg-slate-900 border border-border text-white' : 'bg-emerald-500 text-black hover:bg-emerald-400'
          }`}
        >
          {isSpeaking ? (
            <Volume2 className="h-6 w-6 animate-pulse" />
          ) : isListening ? (
            <Mic className="h-6 w-6 animate-ping text-red-500" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </motion.button>
      </div>

      {/* Floating Dialog Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-border bg-surface-card p-6 shadow-glass space-y-4 backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles className="h-4 w-4 text-saffron-400" />
                <span>Guru AI Voice Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Visualizer Pulsing Orb */}
            <div className="flex justify-center py-4">
              <motion.div
                animate={{
                  scale: isListening ? [1, 1.2, 1] : isSpeaking ? [1, 1.15, 1.05, 1.15, 1] : 1,
                  borderColor: isListening ? '#ef4444' : isSpeaking ? '#ff9933' : '#10b981'
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="h-24 w-24 rounded-full border-4 flex items-center justify-center bg-black/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              >
                {isListening ? (
                  <Mic className="h-8 w-8 text-red-500 animate-pulse" />
                ) : isSpeaking ? (
                  <Volume2 className="h-8 w-8 text-saffron-400" />
                ) : isProcessing ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
                ) : (
                  <MicOff className="h-8 w-8 text-slate-500" />
                )}
              </motion.div>
            </div>

            {/* Status text */}
            <div className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-500">
              {isListening ? 'Listening...' : isProcessing ? 'Processing query...' : isSpeaking ? 'Speaking...' : 'Ready'}
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-[10px] text-red-400 flex items-center gap-1.5 leading-normal">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Display Transcript */}
            {transcript && (
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">You said:</span>
                <p className="p-2.5 rounded-xl border border-border/40 bg-black/20 text-slate-300 leading-normal italic">
                  "{transcript}"
                </p>
              </div>
            )}

            {/* Display Response */}
            {response && (
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-saffron-400 uppercase font-semibold">Guru AI:</span>
                <p className="p-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-slate-200 leading-normal">
                  {response}
                </p>
              </div>
            )}

            {/* Trigger Microphone button */}
            <div className="flex gap-2 text-xs font-bold pt-2">
              {isListening ? (
                <button 
                  onClick={stopListening} 
                  className="w-full rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 py-2.5 text-red-400 transition-colors"
                >
                  Stop Listening
                </button>
              ) : (
                <button 
                  onClick={startListening} 
                  className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-black shadow-glow transition-all flex items-center justify-center gap-1.5"
                >
                  <Mic className="h-4 w-4" /> Tap to Talk
                </button>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
