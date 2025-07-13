import React from "react";
import { Edit3, Copy, Share } from "lucide-react";
import VoicePlayback from "./voice-playback";
import { useSpeech } from "../hooks/use-speech";

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
  onEdit,
}: MessageActionsProps) {
  const { isPlaying, isTTSLoading, playText, stopSpeaking } = useSpeech();

  return (
    <div className={`relative z-20 flex flex-row gap-1 p-2 opacity-100`}>
      {/* Edit button - only for user messages */}
      {isUserMessage && onEdit && (
        <button
          onClick={onEdit}
          className="cursor-pointer rounded-lg bg-orange-100 p-2 text-orange-700 transition-colors hover:bg-orange-200"
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
        className="cursor-pointer rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
        title="Copiar mensaje"
      >
        <Copy className="h-4 w-4" />
      </button>

      <button
        onClick={() => onShare(messageText)}
        className="cursor-pointer rounded-lg bg-blue-100 p-2 text-blue-700 transition-colors hover:bg-blue-200"
        title="Compartir mensaje"
      >
        <Share className="h-4 w-4" />
      </button>
    </div>
  );
}
