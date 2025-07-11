import React from 'react';
import { Edit3, Copy, Share } from 'lucide-react';

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
  return (
    <div
      className={`absolute ${isUserMessage ? "left-4" : "right-4"} -bottom-10 flex flex-row gap-1 transition-opacity duration-200 
        opacity-100 md:opacity-0 md:group-hover:opacity-100`}
    >
      {/* Edit button - only for user messages */}
      {isUserMessage && onEdit && (
        <button
          onClick={onEdit}
          className="cursor-pointer rounded-full bg-white p-2 shadow-md transition-colors duration-150 hover:bg-gray-50"
          title="Editar mensaje"
        >
          <Edit3 className="h-4 w-4 text-gray-600" />
        </button>
      )}
      
      <button
        onClick={() => onCopy(messageText)}
        className="cursor-pointer rounded-full bg-white p-2 shadow-md transition-colors duration-150 hover:bg-gray-50"
        title="Copiar mensaje"
      >
        <Copy className="h-4 w-4 text-gray-600" />
      </button>
      
      <button
        onClick={() => onShare(messageText)}
        className="cursor-pointer rounded-full bg-white p-2 shadow-md transition-colors duration-150 hover:bg-gray-50"
        title="Compartir mensaje"
      >
        <Share className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}
