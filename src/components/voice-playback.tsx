import React from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface VoicePlaybackProps {
  messageText: string;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: (text: string) => Promise<void>;
  onStop: () => void;
}

export default function VoicePlayback({
  messageText,
  isPlaying,
  isLoading,
  onPlay,
  onStop,
}: VoicePlaybackProps) {
  const handleClick = () => {
    if (isPlaying) {
      onStop();
    } else {
      void onPlay(messageText);
    }
  };

  // Don't show for very short messages
  if (!messageText || messageText.trim().length < 10) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        isLoading
          ? 'bg-gray-100 text-gray-500'
          : isPlaying 
          ? 'bg-red-100 hover:bg-red-200 text-red-700' 
          : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
      }`}
      title={isPlaying ? 'Detener reproducción' : 'Reproducir mensaje'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </button>
  );
}
