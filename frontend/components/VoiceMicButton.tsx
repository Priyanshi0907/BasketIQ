"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, X, Volume2 } from "lucide-react";

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  className?: string;
  size?: number;
  title?: string;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: ISpeechRecognitionEvent) => void;
  onerror: (event: ISpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

const VOICE_PRESETS = [
  { label: "Chai & Snacks", text: "I bought tea, milk, sugar and marie biscuits." },
  { label: "Bakery & Breakfast", text: "I bought muffin, bagel, butter and coffee." },
  { label: "South Indian Breakfast", text: "Getting idli batter, sambar powder, curry leaves and ghee." },
  { label: "Daily Indian Sabzi", text: "Need atta, potatoes, onions, tomatoes and spices." },
  { label: "Dal Chawal Comfort", text: "Buying toor dal, basmati rice, ghee and papad." },
  { label: "Party & Celebration", text: "Getting cake, balloons, candles and chips for party." },
  { label: "Paneer Butter Masala", text: "Need paneer, butter, fresh cream and garlic paste." },
  { label: "Evening Samosa Chaat", text: "Buying frozen samosa, green chutney, tea and curd." },
];

export default function VoiceMicButton({
  onTranscript,
  onFinalTranscript,
  className = "",
  size = 16,
  title = "Click to speak (Voice input)",
}: VoiceMicButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [customVoiceText, setCustomVoiceText] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        setIsSupported(false);
      }
    }
  }, []);

  const startListening = (langOverride?: string) => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setShowModal(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      
      // Try en-IN first, fallback to navigator language or en-US if network error
      const chosenLang =
        langOverride ||
        (retryCountRef.current === 1
          ? navigator.language || "en-US"
          : retryCountRef.current >= 2
          ? "en-US"
          : "en-IN");

      recognition.lang = chosenLang;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text) {
          onTranscript(text);
          if (finalTranscript) {
            if (onFinalTranscript) {
              onFinalTranscript(finalTranscript);
            }
            setShowModal(false);
          }
        }
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        console.warn("Speech recognition event error:", event.error);
        setIsListening(false);

        if (event.error === "network") {
          // If browser speech service returned network error, try fallback language once
          if (retryCountRef.current < 2) {
            retryCountRef.current += 1;
            setTimeout(() => {
              startListening(retryCountRef.current === 1 ? "en-US" : "");
            }, 300);
            return;
          }
          // If still failing (e.g. offline or browser cloud service blocked), open Voice Assist Modal
          setErrorMessage("Browser voice service unavailable. Opening voice assistant...");
          setTimeout(() => {
            setShowModal(true);
            setErrorMessage(null);
          }, 600);
        } else if (event.error === "not-allowed") {
          setErrorMessage("Microphone permission denied.");
          setShowModal(true);
        } else if (event.error !== "no-speech") {
          setErrorMessage(`Mic notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not launch SpeechRecognition:", err);
      setIsListening(false);
      setShowModal(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    retryCountRef.current = 0;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSelectPreset = (presetText: string) => {
    onTranscript(presetText);
    if (onFinalTranscript) {
      onFinalTranscript(presetText);
    }
    setShowModal(false);
  };

  const handleApplyCustom = () => {
    if (customVoiceText.trim()) {
      onTranscript(customVoiceText.trim());
      if (onFinalTranscript) {
        onFinalTranscript(customVoiceText.trim());
      }
      setCustomVoiceText("");
      setShowModal(false);
    }
  };

  return (
    <>
      <div className="relative inline-flex items-center group">
        <button
          type="button"
          onClick={toggleListening}
          title={
            !isSupported
              ? "Click to open Voice Assistant"
              : errorMessage
              ? errorMessage
              : isListening
              ? "Listening... Click to stop"
              : title
          }
          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isListening
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
              : "bg-clay-pale text-clay hover:bg-clay hover:text-white"
          } ${className}`}
        >
          {/* Pulsing ring animation when active */}
          {isListening && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75 pointer-events-none" />
          )}
          {isListening ? (
            <Mic size={size} className="animate-pulse" />
          ) : !isSupported ? (
            <MicOff size={size} className="opacity-60 text-muted" />
          ) : (
            <Mic size={size} />
          )}
        </button>

        {/* Floating listening indicator */}
        {isListening && (
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md animate-fade-in z-30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            Listening... Speak now
          </span>
        )}

        {errorMessage && !isListening && (
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-medium px-2 py-0.5 rounded shadow z-30 flex items-center gap-1">
            {errorMessage}
          </span>
        )}
      </div>

      {/* Voice Assistant / Fallback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-cream-card border border-black/[0.08] rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-ink font-display text-lg">
                <span className="w-8 h-8 rounded-lg bg-clay-pale text-clay flex items-center justify-center">
                  <Mic size={16} />
                </span>
                Voice Input Assistant
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-black/[0.05] flex items-center justify-center text-muted hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed mb-4">
              Browser speech recognition works best online. You can retry live voice dictation or pick a voice basket preset below:
            </p>

            {/* Live Dictation Retry Button */}
            <div className="bg-cream-soft rounded-xl p-4 mb-4 flex items-center justify-between border border-black/[0.05]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    retryCountRef.current = 0;
                    startListening();
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-all ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-clay text-white hover:bg-clay/90"
                  }`}
                >
                  <Mic size={20} />
                </button>
                <div>
                  <div className="text-sm font-medium text-ink">
                    {isListening ? "Listening... Speak your basket" : "Try Live Microphone"}
                  </div>
                  <div className="text-[11px] text-muted">
                    {isListening ? "Speak now..." : "Click to speak in your microphone"}
                  </div>
                </div>
              </div>
              {isListening && (
                <button
                  onClick={stopListening}
                  className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100"
                >
                  Stop
                </button>
              )}
            </div>

            {/* Quick Spoken Presets */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-ink mb-2 flex items-center gap-1.5">
                <Volume2 size={13} className="text-clay" /> Spoken Basket Presets:
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {VOICE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleSelectPreset(preset.text)}
                    className="text-left text-xs p-2.5 rounded-xl border border-black/[0.06] bg-white hover:border-clay/40 hover:bg-clay-pale/30 transition-all flex flex-col gap-1"
                  >
                    <span className="font-medium text-ink flex items-center gap-1">
                      <Sparkles size={11} className="text-clay" /> {preset.label}
                    </span>
                    <span className="text-[10px] text-muted line-clamp-2 italic">
                      &ldquo;{preset.text}&rdquo;
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Type / Dictate Fallback */}
            <div className="flex gap-2 pt-2 border-t border-black/[0.06]">
              <input
                value={customVoiceText}
                onChange={(e) => setCustomVoiceText(e.target.value)}
                placeholder="Or type basket here..."
                className="text-xs flex-1 border border-black/[0.08] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-clay/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyCustom();
                }}
              />
              <button
                onClick={handleApplyCustom}
                disabled={!customVoiceText.trim()}
                className="text-xs font-medium bg-forest hover:bg-forest-light disabled:opacity-50 text-cream px-4 py-2 rounded-xl transition-colors"
              >
                Use Basket
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
