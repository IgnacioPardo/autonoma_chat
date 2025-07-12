import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onTranscriptSubmit: (text: string) => void;
}

export default function VoiceInput({
  isListening,
  isSupported,
  transcript,
  onStartListening,
  onStopListening,
  onTranscriptSubmit,
}: VoiceInputProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMicClick = () => {
    if (isListening) {
      onStopListening();
      if (transcript.trim()) {
        onTranscriptSubmit(transcript.trim());
      }
    } else {
      onStartListening();
    }
  };

  // Show loading state during hydration
  if (!isClient) {
    return (
      <button
        disabled
        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-not-allowed"
        title="Loading voice input..."
      >
        <Loader2 className="h-[18px] w-[18px] animate-spin" />
      </button>
    );
  }

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-not-allowed"
        title="Speech recognition not supported in this browser"
      >
        <MicOff className="h-[18px] w-[18px]" />
      </button>
    );
  }

  return (
    <div className="flex items-center">
      <button
        onClick={handleMicClick}
        className={`p-2 rounded-lg transition-colors cursor-pointer ${
          isListening
            ? 'text-red-500 hover:bg-red-50 animate-pulse'
            : 'text-primary-violet hover:bg-gray-100'
        }`}
        title={isListening ? 'Stop recording (click or speak to send)' : 'Start voice input'}
      >
        {isListening ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : (
          <Mic className="h-[18px] w-[18px]" />
        )}
      </button>
      
      {/* Live transcript display - more compact */}
      {isListening && transcript && (
        <div className="text-xs text-gray-500 italic max-w-[120px] truncate ml-1">
          &ldquo;{transcript}&rdquo;
        </div>
      )}
    </div>
  );
}
