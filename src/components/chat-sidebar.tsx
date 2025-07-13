"use client";

import { useState, useEffect } from 'react';
import { getChatHistory, deleteChatHistory, generateChatTitle, type ChatHistory } from '~/lib/chat-history';
import { MessageSquare, Trash2, Plus, Clock, X, RefreshCw } from 'lucide-react';
import { toastUtils } from '~/lib/toast-utils';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chat: ChatHistory) => void;
  onNewChat: () => void;
  currentChatId?: string;
  onChatDeleted?: (chatId: string) => void;
  refreshTrigger?: number;
}

export default function ChatSidebar({ 
  isOpen, 
  onClose, 
  onSelectChat, 
  onNewChat, 
  currentChatId,
  onChatDeleted,
  refreshTrigger 
}: ChatSidebarProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingTitle, setRegeneratingTitle] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      void loadChatHistory();
    }
  }, [isOpen, refreshTrigger]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const chats = await getChatHistory();
      setChatHistory(chats);
    } catch (error) {
      console.error('Error loading chat history:', error);
      toastUtils.apiError(error, 'Error al cargar el historial de chats');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateTitle = async (chat: ChatHistory, e: React.MouseEvent) => {
    e.stopPropagation();
    if (chat.messages.length < 2) return;
    
    setRegeneratingTitle(chat.id);
    try {
      // Convert ChatHistory messages to Message format for title generation
      const messages = chat.messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: new Date(msg.createdAt)
      }));
      
      const newTitle = await generateChatTitle(messages);
      
      // Update the title in the database
      const response = await fetch(`/api/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      
      if (response.ok) {
        // Update the local state
        setChatHistory(prev => prev.map(c => 
          c.id === chat.id ? { ...c, title: newTitle } : c
        ));
        toastUtils.success('Título regenerado correctamente');
      } else {
        throw new Error('Error al actualizar el título');
      }
    } catch (error) {
      console.error('Error regenerating title:', error);
      toastUtils.apiError(error, 'Error al regenerar el título');
    } finally {
      setRegeneratingTitle(null);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatHistory(chatId);
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      
      // If we deleted the current chat, notify parent
      if (chatId === currentChatId && onChatDeleted) {
        onChatDeleted(chatId);
      }
      
      toastUtils.success('Chat eliminado correctamente');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toastUtils.apiError(error, 'Error al eliminar el chat');
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
          className="fixed inset-0 bg-black opacity-10 backdrop-blur z-[45]"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-sm 
        shadow-xl border-r border-gray-200/50 z-[80] transform transition-transform duration-300
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
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary-blue to-primary-violet text-white hover:shadow-lg transition-all duration-200 cursor-pointer"
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
                      {chat.title ?? 'Chat sin título'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(chat.updatedAt)} • {chat.messages.length} mensajes
                    </p>
                  </div>
                  
                  <div className="flex gap-1 transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    {chat.messages.length >= 2 && (
                      <button
                        onClick={(e) => handleRegenerateTitle(chat, e)}
                        disabled={regeneratingTitle === chat.id}
                        className="p-1 hover:bg-blue-100 rounded-lg transition-all duration-200 cursor-pointer"
                        title="Regenerar título"
                      >
                        <RefreshCw 
                          size={14} 
                          className={`text-blue-500 ${regeneratingTitle === chat.id ? 'animate-spin' : ''}`} 
                        />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="p-1 hover:bg-red-100 rounded-lg transition-all duration-200 cursor-pointer"
                      title="Eliminar chat"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
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
