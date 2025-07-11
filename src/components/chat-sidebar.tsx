"use client";

import { useState, useEffect } from 'react';
import { getChatHistory, deleteChatHistory, type ChatHistory } from '~/lib/chat-history';
import { MessageSquare, Trash2, Plus, Clock, X } from 'lucide-react';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chat: ChatHistory) => void;
  onNewChat: () => void;
  currentChatId?: string;
}

export default function ChatSidebar({ 
  isOpen, 
  onClose, 
  onSelectChat, 
  onNewChat, 
  currentChatId 
}: ChatSidebarProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const chats = await getChatHistory();
      setChatHistory(chats);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatHistory(chatId);
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-sm 
        shadow-xl border-r border-gray-200/50 z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="text-primary-violet" />
            <h2 className="text-xl font-semibold text-gray-800">Historial</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200/50">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary-blue to-primary-violet text-white hover:shadow-lg transition-all duration-200"
          >
            <Plus size={20} />
            <span className="font-medium">Nuevo Chat</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-violet"></div>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Clock size={48} className="mb-3 opacity-50" />
              <p className="text-sm text-center">Aún no tienes chats guardados</p>
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat);
                  onClose();
                }}
                className={`
                  group relative p-3 rounded-xl cursor-pointer transition-all duration-200
                  hover:bg-gray-100/80 hover:shadow-sm
                  ${currentChatId === chat.id ? 'bg-primary-blue/10 border border-primary-blue/20' : 'bg-white/50'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 text-sm truncate">
                      {chat.title || 'Chat sin título'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(chat.updatedAt)} • {chat.messages.length} mensajes
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg transition-all duration-200"
                    title="Eliminar chat"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
                
                {/* Preview of first message */}
                {chat.messages[0] && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                    {chat.messages[0].content.slice(0, 100)}...
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
