"use client";

import { useState, useEffect } from "react";
import ChatMessages from "~/components/chat-messages";
import LoadingIndicator from "~/components/loading-indicator";
import { toastUtils } from "~/lib/toast-utils";
import type { Message } from "ai";

interface PublicChatHistory {
  id: string;
  title?: string;
  createdAt: string;
  messages: {
    id: string;
    role: string;
    content: string;
    position: number;
    createdAt: string;
    attachments: {
      id: string;
      name: string;
      contentType: string;
      url: string;
      size?: number;
    }[];
  }[];
  isPublic: boolean;
}

interface PublicChatViewProps {
  chatId: string;
}

export default function PublicChatView({ chatId }: PublicChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPublicChat = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/chats/${chatId}/public`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Chat no encontrado");
          } else {
            setError("Error al cargar el chat");
          }
          return;
        }

        const chat: PublicChatHistory = await response.json() as PublicChatHistory;
        setChatTitle(chat.title ?? "Chat compartido");

        // Convert to Message format for ChatMessages component
        const convertedMessages: Message[] = chat.messages.map((msg) => ({
          id: msg.id,
          role: (msg.role === "user" || msg.role === "assistant" || msg.role === "system") 
            ? msg.role 
            : "assistant" as const,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          experimental_attachments: msg.attachments?.map((att) => ({
            name: att.name,
            contentType: att.contentType,
            url: att.url,
          })),
        }));

        setMessages(convertedMessages);
      } catch (error) {
        console.error("Error loading public chat:", error);
        setError("Error al cargar el chat");
        toastUtils.error("Error al cargar el chat compartido");
      } finally {
        setIsLoading(false);
      }
    };

    if (chatId) {
      void loadPublicChat();
    }
  }, [chatId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 p-8">
        <LoadingIndicator isLoading={true} />
        <span className="ml-3 text-sm text-gray-600">Cargando chat compartido...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center flex-1 p-8">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">{error}</div>
          <div className="text-gray-500 text-sm">
            Este chat no está disponible o ha sido eliminado.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header with chat title and read-only indicator */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            {chatTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            📖 Vista de solo lectura - Chat compartido
          </p>
        </div>
      </div>

      {/* Messages */}
      <main className="pb-safe animate-in fade-in z-1 flex h-full w-full flex-col items-center justify-start overflow-hidden duration-300">
        <ChatMessages
          messages={messages}
          isLoading={false}
          editingMessageId={null}
          editText=""
          setEditText={() => {
            // No-op in read-only mode
          }}
          startEdit={() => {
            // No-op in read-only mode
          }}
          saveEdit={() => Promise.resolve()}
          cancelEdit={() => {
            // No-op in read-only mode
          }}
          copyToClipboardHandler={async (text: string) => {
            try {
              await navigator.clipboard.writeText(text);
              toastUtils.success("Texto copiado al portapapeles");
            } catch (error) {
              console.error("Error copying to clipboard:", error);
              toastUtils.error("Error al copiar texto");
            }
          }}
          shareTextHandler={async (text: string) => {
            if (navigator.share) {
              try {
                await navigator.share({ text });
              } catch (error) {
                console.error("Error sharing text:", error);
              }
            } else {
              // Fallback to copy
              try {
                await navigator.clipboard.writeText(text);
                toastUtils.success("Texto copiado al portapapeles");
              } catch (error) {
                console.error("Error copying to clipboard:", error);
                toastUtils.error("Error al copiar texto");
              }
            }
          }}
          readOnlyMode={true}
        />
      </main>

      {/* Footer with branding/link to app */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 px-4 py-3">
        <div className="text-center space-y-2">
          <button
            onClick={() => window.open("/", "_blank")}
            className="bg-primary-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-blue/90 transition-colors"
          >
            Crear mi propio chat
          </button>
          <p className="text-xs text-gray-500">
            Creado con{" "}
            <a 
              href="/" 
              className="text-primary-blue hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Autonoma Chat
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
