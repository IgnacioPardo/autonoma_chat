"use client";

import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import MessageActions from "~/components/message-actions";
import ChatSidebar from "~/components/chat-sidebar";
import NavBar from "~/components/navbar";
import Markdown from 'react-markdown';
import { Send, Pencil, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { saveChatHistory, updateChatHistory, getChatById, generateChatTitle, type ChatHistory } from '~/lib/chat-history';
import type { Message } from 'ai';

export default function HomePage() {
  const { messages, input, handleInputChange, handleSubmit, setMessages, reload } = useChat({
    onFinish: async (message) => {
      // Save chat when AI response is complete
      await saveChatAfterMessage([...messages, message]);
    }
  });
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

  // Helper function to save chat after key events
  const saveChatAfterMessage = async (messagesToSave: Message[]) => {
    if (messagesToSave.length === 0 || isSaving) return;
    
    setIsSaving(true);
    try {
      if (currentChatId) {
        // Verify the chat still exists before updating
        try {
          await updateChatHistory(currentChatId, messagesToSave);
          
          // If this is the first AI response (messages length is 2), regenerate title
          if (messagesToSave.length === 2 && messagesToSave[1]?.role === 'assistant') {
            try {
              const newTitle = await generateChatTitle(messagesToSave);
              // Update the chat with the new title
              const response = await fetch(`/api/chats/${currentChatId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
              });
              if (!response.ok) {
                console.warn('Failed to update chat title');
              }
            } catch (titleError) {
              console.warn('Failed to generate new title:', titleError);
            }
          }
        } catch (updateError) {
          // If update fails, create a new chat instead
          console.log('Chat no longer exists, creating new one');
          const savedChat = await saveChatHistory(messagesToSave);
          setCurrentChatId(savedChat.id);
        }
      } else {
        const savedChat = await saveChatHistory(messagesToSave);
        setCurrentChatId(savedChat.id);
        setSidebarRefreshTrigger(prev => prev + 1); // Trigger sidebar refresh
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    } finally {
      setTimeout(() => setIsSaving(false), 500); // Small delay to show saving state
    }
  };

  // Custom form submit handler to save after user message
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!input.trim()) return;
    
    // Call the original handleSubmit
    handleSubmit(e);
    
    // Save chat after user message is added
    // We need to wait a bit for the message to be added to the state
    setTimeout(async () => {
      // Get the updated messages state (should include the new user message)
      const currentMessages = [...messages];
      if (currentMessages.length > 0) {
        await saveChatAfterMessage(currentMessages);
      }
    }, 500);
  };

  const startEdit = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditText(currentText);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const saveEdit = async (messageId: string) => {
    if (!editText.trim()) {
      cancelEdit();
      return;
    }

    // Find the index of the edited message
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Update the message text
    const updatedMessages = messages.map((message, index) => {
      if (index === messageIndex) {
        return {
          ...message,
          content: editText.trim()
        };
      }
      return message;
    });

    // Keep only messages up to and including the edited one
    const newMessages = updatedMessages.slice(0, messageIndex + 1);
    
    // Update the messages state
    setMessages(newMessages);
    
    // Clear editing state
    setEditingMessageId(null);
    setEditText("");

    // Save to database
    if (currentChatId) {
      try {
        await updateChatHistory(currentChatId, newMessages);
      } catch (error) {
        console.error('Error updating chat:', error);
        // If update fails, try creating a new chat
        try {
          const savedChat = await saveChatHistory(newMessages);
          setCurrentChatId(savedChat.id);
        } catch (saveError) {
          console.error('Error creating new chat:', saveError);
        }
      }
    } else {
      // Create new chat if no current chat ID
      try {
        const savedChat = await saveChatHistory(newMessages);
        setCurrentChatId(savedChat.id);
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    }

    // If this was a user message, trigger regeneration
    if (messages[messageIndex]?.role === 'user') {
      setTimeout(() => {
        reload();
      }, 100);
    }
  };

  const handleSelectChat = async (chat: ChatHistory) => {
    try {
      // Convert ChatHistory messages to the format expected by useChat
      const convertedMessages: Message[] = chat.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: new Date(msg.createdAt)
      }));
      
      setMessages(convertedMessages);
      setCurrentChatId(chat.id);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const handleChatDeleted = (deletedChatId: string) => {
    // If the deleted chat was the current one, reset to new chat state
    if (deletedChatId === currentChatId) {
      setCurrentChatId(null);
      // Don't clear messages here as the user might still be in a conversation
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setEditingMessageId(null);
    setEditText("");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Error copying text: ", err);
    }
  };

  const shareText = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mensaje de Autonoma Chat",
          text: text,
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Error sharing: ", err);
        // Fallback: copiar al clipboard
        await copyToClipboard(text);
      }
    } else {
      // Fallback: copiar al clipboard
      await copyToClipboard(text);
    }
  };

  return (
    <body className="flex min-h-screen w-full flex-col items-center justify-center">
      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        currentChatId={currentChatId || undefined}
        onChatDeleted={handleChatDeleted}
        refreshTrigger={sidebarRefreshTrigger}
      />
      
      {/* background */}
      <div className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat z-0 scale-110 blur-sm"></div> 
      
      {/* NavBar */}
      <NavBar 
        onOpenSidebar={() => setSidebarOpen(true)}
        isSaving={isSaving}
      />

      <main className="flex min-h-screen w-5/6 sm:w-4/5 md:w-2/3 flex-col items-center justify-start overflow-y-auto">
        <div className="flex w-full flex-col space-y-12 sm:space-y-8 pt-28 pb-40">
          {messages.map((message) => {
            const messageText = message.content;

            return (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`group relative max-w-xs rounded-2xl px-4 py-3 lg:max-w-md ${
                    message.role === "user"
                      ? "from-primary-blue to-primary-violet rounded-br-sm bg-gradient-to-b text-white"
                      : "rounded-bl-sm border border-gray-200 bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm"
                  }`}
                >
                  {editingMessageId === message.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            saveEdit(message.id);
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEdit();
                          }
                        }}
                        className="w-full min-h-[80px] p-3 rounded-lg border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary-violet text-gray-800 bg-white text-xs sm:text-sm leading-relaxed"
                        placeholder="Escribe tu mensaje editado..."
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => saveEdit(message.id)}
                          disabled={!editText.trim()}
                          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          title="Guardar cambios"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                          title="Cancelar edición"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal message display
                    <>
                      <div
                        className={`prose prose-sm sm:prose-base max-w-none ${
                          message.role === "user" 
                            ? "prose-invert [&_code]:bg-white/20 [&_pre]:bg-white/10 [&_code]:text-gray-100" 
                            : "[&_code]:bg-gray-100 [&_pre]:bg-gray-50 [&_code]:text-gray-800"
                        }`}
                      >
                        <Markdown>
                          {messageText}
                        </Markdown>
                      </div>

                      {/* Botones de acción que aparecen al hacer hover */}
                      <MessageActions
                        messageText={messageText}
                        isUserMessage={message.role === "user"}
                        onCopy={copyToClipboard}
                        onShare={shareText}
                        onEdit={message.role === "user" ? () => startEdit(message.id, messageText) : undefined}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}

        </div>
        
        <>
          {/* Background Blur behind input - solo visible cuando hay mensajes */}
          {messages.length > 0 && (
            <div 
              className="fixed bottom-0 w-full h-[140px] backdrop-blur-xs mask-gradient"
            ></div>
          )}
          
          {/* Input Form - posición dinámica basada en si hay mensajes */}
          <div className={`fixed w-5/6 sm:w-4/5 md:w-2/3 p-4 transition-all duration-1000 ease-in-out ${
            messages.length === 0 
              ? "bottom-2/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
              : "bottom-0 left-1/2 transform -translate-x-1/2"
          }`}>
            <form
              onSubmit={
                // If there are no messages, wait 200ms before submitting to allow transition to bottom
                messages.length === 0 
                  ? (e) => {
                      e.preventDefault();
                      setTimeout(() => handleFormSubmit(e), 200);
                    } 
                  : handleFormSubmit
              }
              className="mb-4 flex w-full flex-row items-center gap-3"
            >
              <div className="relative flex-1">
                <Pencil 
                  size={18} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-violet z-20 transition-colors duration-300" 
                />
                <input
                  className={`
                    h-[56px] w-full rounded-2xl border border-gray-300 pl-12 pr-4 py-4 
                    shadow-sm backdrop-blur-xs transition-all duration-500 ease-in-out
                    focus:ring-primary-violet focus:border-transparent focus:ring-2 focus:outline-none
                    text-sm sm:text-base
                    ${messages.length === 0 
                      ? 'bg-white/75 border-gray-300/60 shadow-lg' 
                      : 'bg-white/40 border-gray-300/40 shadow-sm'
                    }
                  `}
                  value={input}
                  placeholder={messages.length === 0 ? "Comienza una conversación..." : "Escribe tu mensaje..."}
                  onChange={handleInputChange}
                />
              </div>

              <button
                type="submit"
                className="from-primary-blue to-primary-violet border-border-violet flex h-[56px] items-center justify-center rounded-2xl border bg-gradient-to-b px-4 py-4 whitespace-nowrap text-white shadow-lg transition-shadow duration-200 hover:shadow-xl gap-2 text-sm sm:text-base"
              >
                <Send size={20} />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </form>
          </div>
        </>
      </main>
    </body>
  );
}
