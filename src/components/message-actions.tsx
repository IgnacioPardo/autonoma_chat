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
          className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors cursor-pointer"
          title="Editar mensaje"
        >
          <Edit3 className="h-4 w-4" />
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
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
        title="Copiar mensaje"
      >
        <Copy className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => onShare(messageText)}
        className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors cursor-pointer"
        title="Compartir mensaje"
      >
        <Share className="h-4 w-4" />
      </button>
    </div>
  );
}
