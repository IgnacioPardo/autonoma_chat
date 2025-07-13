"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, Volume2 } from "lucide-react";

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const VOICE_OPTIONS = [
  { value: "alloy", name: "Alloy", description: "Neutral, balanced" },
  { value: "ash", name: "Ash", description: "Warm, friendly" },
  { value: "ballad", name: "Ballad", description: "Expressive, dynamic" },
  { value: "coral", name: "Coral", description: "Bright, engaging" },
  { value: "echo", name: "Echo", description: "Clear, articulate" },
  { value: "fable", name: "Fable", description: "Storytelling, rich" },
  { value: "nova", name: "Nova", description: "Young, energetic" },
  { value: "onyx", name: "Onyx", description: "Deep, authoritative" },
  { value: "sage", name: "Sage", description: "Calm, wise" },
  { value: "shimmer", name: "Shimmer", description: "Gentle, soothing" },
] as const;

export type VoiceOption = (typeof VOICE_OPTIONS)[number]["value"];

export default function VoiceSettings({ isOpen, onClose }: VoiceSettingsProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>("alloy");
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  // Load saved voice preference
  useEffect(() => {
    const savedVoice = localStorage.getItem("tts-voice") as VoiceOption;
    if (savedVoice && VOICE_OPTIONS.some((v) => v.value === savedVoice)) {
      setSelectedVoice(savedVoice);
    }
  }, []);

  // Save voice preference
  const handleVoiceChange = (voice: VoiceOption) => {
    setSelectedVoice(voice);
    localStorage.setItem("tts-voice", voice);
  };

  // Preview voice
  const previewVoice = async (voice: VoiceOption) => {
    if (isPlaying === voice) return;

    setIsPlaying(voice);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: `Hola, soy la voz ${VOICE_OPTIONS.find((v) => v.value === voice)?.name}. Esta es una muestra de cómo sueno.`,
          voice: voice,
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          setIsPlaying(null);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setIsPlaying(null);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
      } else {
        setIsPlaying(null);
      }
    } catch (error) {
      console.error("Error previewing voice:", error);
      setIsPlaying(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="bg-opacity-10 fixed inset-0 z-[100] flex items-center justify-center bg-white/10 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <motion.div
            className="mx-4 max-h-[80vh] w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-primary-violet" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Configuración de Voz
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-4">
                <p className="mb-3 text-sm text-gray-600">
                  Selecciona tu voz preferida para el texto a voz. Haz clic en
                  el ícono de volumen para escuchar una muestra.
                </p>
              </div>

              {/* Voice Options */}
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {VOICE_OPTIONS.map((voice) => (
                  <div
                    key={voice.value}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border-2 p-3 transition-colors ${
                      selectedVoice === voice.value
                        ? "border-primary-violet bg-primary-violet/5"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleVoiceChange(voice.value)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="voice"
                          value={voice.value}
                          checked={selectedVoice === voice.value}
                          onChange={() => handleVoiceChange(voice.value)}
                          className="text-primary-violet focus:ring-primary-violet"
                        />
                        <div>
                          <div className="font-medium text-gray-800">
                            {voice.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {voice.description}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void previewVoice(voice.value);
                      }}
                      disabled={isPlaying !== null}
                      className={`rounded-lg p-2 transition-colors ${
                        isPlaying === voice.value
                          ? "bg-primary-violet text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                      title="Escuchar muestra"
                    >
                      {isPlaying === voice.value ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Volume2 size={16} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export function to get current voice
export function getCurrentVoice(): VoiceOption {
  if (typeof window === "undefined") return "alloy";
  const savedVoice = localStorage.getItem("tts-voice") as VoiceOption;
  return savedVoice && VOICE_OPTIONS.some((v) => v.value === savedVoice)
    ? savedVoice
    : "alloy";
}
