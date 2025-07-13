"use client";

import { useState } from "react";
import {
  getChatHistory,
  deleteChatHistory,
  generateChatTitle,
  type ChatHistory,
} from "~/lib/chat-history";
import { MessageSquare, Trash2, Plus, Clock, X, RefreshCw } from "lucide-react";
import { toastUtils } from "~/lib/toast-utils";
import useSWR from "swr";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chat: ChatHistory) => void;
  onNewChat: () => void;
  currentChatId?: string;
  onChatDeleted?: (chatId: string) => void;
  refreshTrigger?: number;
}

const fetchChatHistory = async () => {
  try {
    return await getChatHistory();
  } catch (error) {
    toastUtils.apiError(error, "Error al cargar el historial de chats");
    return [];
  }
};

export default function ChatSidebar({
  isOpen,
  onClose,
  onSelectChat,
  onNewChat,
  currentChatId,
  onChatDeleted,
  // refreshTrigger, // Eliminado porque no se usa
}: ChatSidebarProps) {
  const {
    data: chatHistory = [],
    isLoading,
    mutate,
  } = useSWR("chatHistory", fetchChatHistory, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });
  const [regeneratingTitle, setRegeneratingTitle] = useState<string | null>(
    null,
  );
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

  const handleSelectChat = (chat: ChatHistory) => {
    setLoadingChatId(chat.id);
    try {
      onSelectChat(chat);
      onClose();
    } catch (error) {
      console.error("Error selecting chat:", error);
      toastUtils.apiError(error, "Error al cargar el chat");
    } finally {
      setLoadingChatId(null);
    }
  };

  const handleRegenerateTitle = async (
    chat: ChatHistory,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (chat.messages.length < 2) return;
    setRegeneratingTitle(chat.id);
    try {
      // Convert ChatHistory messages to Message format for title generation
      const messages = chat.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: new Date(msg.createdAt),
      }));

      const newTitle = await generateChatTitle(messages);

      // Update the title in the database
      const response = await fetch(`/api/chats/${chat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        await mutate(); // Refresca el historial tras actualizar el título
        toastUtils.success("Título regenerado correctamente");
      } else {
        throw new Error("Error al actualizar el título");
      }
    } catch (error) {
      console.error("Error regenerating title:", error);
      toastUtils.apiError(error, "Error al regenerar el título");
    } finally {
      setRegeneratingTitle(null);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatHistory(chatId);
      await mutate(); // Refresca el historial tras eliminar
      // If we deleted the current chat, notify parent
      if (chatId === currentChatId && onChatDeleted) {
        onChatDeleted(chatId);
      }

      toastUtils.success("Chat eliminado correctamente");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toastUtils.apiError(error, "Error al eliminar el chat");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Hoy";
    } else if (diffDays === 1) {
      return "Ayer";
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[45] bg-black opacity-10 backdrop-blur"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`animate-in fade-in fixed top-0 left-0 z-[80] flex h-full w-80 transform flex-col border-r border-gray-200/50 bg-white/95 shadow-xl backdrop-blur-sm transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"} `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200/50 p-6">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="text-primary-violet" />
            <h2 className="text-xl font-semibold text-gray-800">Historial</h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="border-b border-gray-200/50 p-4">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="from-primary-blue to-primary-violet flex w-full cursor-pointer items-center gap-3 rounded-xl bg-gradient-to-r p-3 text-white transition-all duration-200 hover:shadow-lg"
          >
            <Plus size={20} />
            <span className="font-medium">Nuevo Chat</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="border-primary-violet h-10 w-10 animate-spin rounded-full border-r-2 border-b-2"></div>
                <div className="border-primary-blue absolute top-0 left-0 h-10 w-10 animate-ping rounded-full border-2 opacity-20"></div>
              </div>
              <p className="mt-4 animate-pulse text-sm text-gray-500">
                Cargando historial...
              </p>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Clock size={48} className="mb-3 opacity-50" />
              <p className="text-center text-sm">
                Aún no tienes chats guardados
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatHistory.map((chat: ChatHistory) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`group relative cursor-pointer rounded-xl p-3 transition-all duration-200 hover:bg-gray-100/80 hover:shadow-sm ${currentChatId === chat.id ? "bg-primary-blue/10 border-primary-blue/20 border" : "bg-white/50"} ${loadingChatId === chat.id ? "pointer-events-none opacity-75" : ""} `}
                >
                  {/* Loading overlay for individual chat */}
                  {loadingChatId === chat.id && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
                      <div className="border-primary-violet h-4 w-4 animate-spin rounded-full border-b-2"></div>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-gray-800">
                        {chat.title ?? "Chat sin título"}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(chat.updatedAt)} • {chat.messages.length}{" "}
                        mensajes
                      </p>
                    </div>

                    <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                      {chat.messages.length >= 2 && (
                        <button
                          onClick={(e) => handleRegenerateTitle(chat, e)}
                          disabled={regeneratingTitle === chat.id}
                          className="cursor-pointer rounded-lg p-1 transition-all duration-200 hover:bg-blue-100"
                          title="Regenerar título"
                        >
                          <RefreshCw
                            size={14}
                            className={`text-blue-500 ${regeneratingTitle === chat.id ? "animate-spin" : ""}`}
                          />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="cursor-pointer rounded-lg p-1 transition-all duration-200 hover:bg-red-100"
                        title="Eliminar chat"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Preview of first message */}
                  {chat.messages[0] && (
                    <p className="mt-2 line-clamp-2 text-xs text-gray-400">
                      {chat.messages[0].content.slice(0, 100)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
