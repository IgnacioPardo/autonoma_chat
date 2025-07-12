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
      className="cursor-pointer rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/50 p-2 shadow-md transition-all duration-150 hover:bg-gray-50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      title={isPlaying ? 'Stop playback' : 'Play message'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-4 w-4 text-red-600" />
      ) : (
        <Volume2 className="h-4 w-4 text-gray-600" />
      )}
    </button>
  );
}
