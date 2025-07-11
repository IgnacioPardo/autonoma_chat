import React from 'react';

interface MessageActionsProps {
  messageText: string;
  isUserMessage: boolean;
  onCopy: (text: string) => void;
  onShare: (text: string) => void;
}

export default function MessageActions({ 
  messageText, 
  isUserMessage, 
  onCopy, 
  onShare 
}: MessageActionsProps) {
  return (
    <div
      className={`absolute ${isUserMessage ? "left-4" : "right-4"} -bottom-10 flex flex-row gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
    >
      <button
        onClick={() => onCopy(messageText)}
        className="cursor-pointer rounded-full bg-white p-2 shadow-md transition-colors duration-150 hover:bg-gray-50"
        title="Copiar mensaje"
      >
        <svg
          className="h-4 w-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>
      <button
        onClick={() => onShare(messageText)}
        className="cursor-pointer rounded-full bg-white p-2 shadow-md transition-colors duration-150 hover:bg-gray-50"
        title="Compartir mensaje"
      >
        <svg
          className="h-4 w-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
          />
        </svg>
      </button>
    </div>
  );
}
