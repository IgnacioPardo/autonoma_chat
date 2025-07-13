import React from 'react';
import { Edit3, Copy, Share } from 'lucide-react';
import VoicePlayback from './voice-playback';
import { useSpeech } from '../hooks/use-speech';

interface MessageActionsProps {
  messageText: string;
  isUserMessage: boolean;
  onCopy: (text: string) => void;
  onShare: (text: string) => void;
  onEdit?: () => void;
}

export default function MessageActions({ 
  messageText, 
  isUserMessage, 
  onCopy, 
  onShare,
  onEdit
}: MessageActionsProps) {
  const {
    isPlaying,
    isTTSLoading,
    playText,
    stopSpeaking,
  } = useSpeech();

  return (
    <div
      className={`relative flex flex-row gap-1 z-20 opacity-100 p-2`}
    >
      {/* Edit button - only for user messages */}
      {isUserMessage && onEdit && (
        <button
          onClick={onEdit}
          className="cursor-pointer rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/50 p-2 shadow-md transition-all duration-150 hover:bg-gray-50 hover:shadow-lg"
          title="Editar mensaje"
        >
          <Edit3 className="h-4 w-4 text-gray-600" />
        </button>
      )}
      
      {/* Voice playback - only for assistant messages */}
      {!isUserMessage && (
        <VoicePlayback
          messageText={messageText}
          isPlaying={isPlaying}
          isLoading={isTTSLoading}
          onPlay={playText}
          onStop={stopSpeaking}
        />
      )}
      
      <button
        onClick={() => onCopy(messageText)}
        className="cursor-pointer rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/50 p-2 shadow-md transition-all duration-150 hover:bg-gray-50 hover:shadow-lg"
        title="Copiar mensaje"
      >
        <Copy className="h-4 w-4 text-gray-600" />
      </button>
      
      <button
        onClick={() => onShare(messageText)}
        className="cursor-pointer rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/50 p-2 shadow-md transition-all duration-150 hover:bg-gray-50 hover:shadow-lg"
        title="Compartir mensaje"
      >
        <Share className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}
