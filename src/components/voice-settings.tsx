"use client";

import { useState, useEffect } from 'react';
import { Settings, Volume2 } from 'lucide-react';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const VOICE_OPTIONS = [
  { value: 'alloy', name: 'Alloy', description: 'Neutral, balanced' },
  { value: 'ash', name: 'Ash', description: 'Warm, friendly' },
  { value: 'ballad', name: 'Ballad', description: 'Expressive, dynamic' },
  { value: 'coral', name: 'Coral', description: 'Bright, engaging' },
  { value: 'echo', name: 'Echo', description: 'Clear, articulate' },
  { value: 'fable', name: 'Fable', description: 'Storytelling, rich' },
  { value: 'nova', name: 'Nova', description: 'Young, energetic' },
  { value: 'onyx', name: 'Onyx', description: 'Deep, authoritative' },
  { value: 'sage', name: 'Sage', description: 'Calm, wise' },
  { value: 'shimmer', name: 'Shimmer', description: 'Gentle, soothing' }
] as const;

export type VoiceOption = typeof VOICE_OPTIONS[number]['value'];

export default function VoiceSettings({ isOpen, onClose }: VoiceSettingsProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('alloy');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  // Load saved voice preference
  useEffect(() => {
    const savedVoice = localStorage.getItem('tts-voice') as VoiceOption;
    if (savedVoice && VOICE_OPTIONS.some(v => v.value === savedVoice)) {
      setSelectedVoice(savedVoice);
    }
  }, []);

  // Save voice preference
  const handleVoiceChange = (voice: VoiceOption) => {
    setSelectedVoice(voice);
    localStorage.setItem('tts-voice', voice);
  };

  // Preview voice
  const previewVoice = async (voice: VoiceOption) => {
    if (isPlaying === voice) return;
    
    setIsPlaying(voice);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: `Hola, soy la voz ${VOICE_OPTIONS.find(v => v.value === voice)?.name}. Esta es una muestra de cómo sueno.`,
          voice: voice
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
      console.error('Error previewing voice:', error);
      setIsPlaying(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-primary-violet" />
            <h2 className="text-lg font-semibold text-gray-800">Configuración de Voz</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Selecciona tu voz preferida para el texto a voz. Haz clic en el ícono de volumen para escuchar una muestra.
            </p>
          </div>

          {/* Voice Options */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {VOICE_OPTIONS.map((voice) => (
              <div
                key={voice.value}
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedVoice === voice.value
                    ? 'border-primary-violet bg-primary-violet/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                      <div className="font-medium text-gray-800">{voice.name}</div>
                      <div className="text-xs text-gray-500">{voice.description}</div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void previewVoice(voice.value);
                  }}
                  disabled={isPlaying !== null}
                  className={`p-2 rounded-lg transition-colors ${
                    isPlaying === voice.value
                      ? 'bg-primary-violet text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                  }`}
                  title="Escuchar muestra"
                >
                  {isPlaying === voice.value ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Volume2 size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export function to get current voice
export function getCurrentVoice(): VoiceOption {
  if (typeof window === 'undefined') return 'alloy';
  const savedVoice = localStorage.getItem('tts-voice') as VoiceOption;
  return savedVoice && VOICE_OPTIONS.some(v => v.value === savedVoice) ? savedVoice : 'alloy';
}
