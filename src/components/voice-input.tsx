import React, { useState, useEffect } from "react";
import { Mic, MicOff, Loader2, CirclePause } from "lucide-react";

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
        className="cursor-not-allowed rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
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
        className="cursor-not-allowed rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
        title="Speech recognition not supported in this browser"
      >
        <MicOff className="h-[18px] w-[18px]" />
      </button>
    );
  }

  return (
    <div className="flex w-full flex-row items-center justify-center gap-2">
      {/* Live transcript display - more compact */}
      {isListening && transcript && (
        <div className="ml-1 max-w-[120px] truncate text-xs text-gray-500 italic">
          &ldquo;{transcript}&rdquo;
        </div>
      )}

      <button
        onClick={handleMicClick}
        className={`cursor-pointer rounded-lg p-2 transition-colors ${
          isListening
            ? "animate-pulse text-red-500 hover:bg-red-50"
            : "text-primary-violet hover:bg-gray-100"
        }`}
        title={
          isListening
            ? "Stop recording (click or speak to send)"
            : "Start voice input"
        }
      >
        {isListening ? (
          <div className="relative h-[18px] w-[18px]">
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
            <CirclePause className="absolute top-0 left-0 z-10 h-[18px] w-[18px]" />
          </div>
        ) : (
          <Mic className="h-[18px] w-[18px]" />
        )}
      </button>
    </div>
  );
}
