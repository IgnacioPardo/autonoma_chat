"use client";

import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import MessageActions from "~/components/message-actions";
import ChatSidebar from "~/components/chat-sidebar";
import NavBar from "~/components/navbar";
import ImageUpload from "~/components/image-upload";
import Markdown from 'react-markdown';
import { Send, Pencil, Check, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { Message } from 'ai';
import type { ChatHistory } from '~/lib/chat-history';
import { saveChatAfterMessage, processImageAttachments } from '~/lib/chat-utils';
import { saveEditedMessage } from '~/lib/message-edit';
import { copyToClipboard, shareText } from '~/lib/clipboard-utils';
import { handleSelectChat, handleChatDeleted, handleNewChat } from '~/lib/chat-handlers';

export default function HomePage() {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [lastSavedMessageCount, setLastSavedMessageCount] = useState(0);

  // Use ref to always have the latest currentChatId in callbacks
  const currentChatIdRef = useRef(currentChatId);
  
  // Keep the ref in sync with state
  useEffect(() => {
    currentChatIdRef.current = currentChatId;
    // console.log('=== currentChatId state changed ===');
    // console.log('Updated currentChatIdRef to:', currentChatId);
    // console.log('Ref now contains:', currentChatIdRef.current);
  }, [currentChatId]);

  const { messages, input, handleInputChange, handleSubmit, setMessages, reload, append, setInput } = useChat({
    onFinish: async (message) => {
      
      // Use setTimeout to ensure messages state is updated
      setTimeout(async () => {
        // Use the ref to get the most up-to-date currentChatId
        const actualCurrentChatId = currentChatIdRef.current;
        
        const inputMessage: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: 
            editingMessageId 
            ? editText.trim() || input 
            : ((
            messages && (messages.length > 0) && (messages[messages.length - 1]) && ((messages[messages.length - 1]) !== undefined) && ((messages[messages.length - 1])?.role === 'user') && messages[messages.length - 1]?.content
          )
            ? (messages[messages.length - 1]?.content) || input
            : input),
          createdAt: new Date()
        };
        let editingIndex = -1;
        if (editingMessageId) {
          editingIndex = messages.findIndex(m => m.id === editingMessageId);
        }

        const completeConversation = [...messages.filter(
          (msg) => {
          if (editingMessageId) {
            // find all messages up to the edited one not by id but by position
            // dont use id for position, use index
            let msgIndex = messages.findIndex(m => m.id === msg.id);
            return msgIndex < editingIndex;
          }
          return true
        }
        ), inputMessage, message];
        
        await saveChatAfterMessage(completeConversation, {
          currentChatId: actualCurrentChatId,
          setCurrentChatId,
          setSidebarRefreshTrigger,
          setIsSaving
        });
        setLastSavedMessageCount(messages.length);
      }, 100);
    }
  });


  useEffect(() => {
    console.log(messages);
  }, [messages]);


  const handleImageUpload = (file: File) => {
    setUploadedImages(prev => [...prev, file]);
  };

  const handleImageRemove = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Custom form submit handler to handle images
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() && uploadedImages.length === 0) return;
    
    if (uploadedImages.length > 0) {
      // Process images for attachment
      const attachments = await processImageAttachments(uploadedImages);

      // Clear images after processing
      setUploadedImages([]);
      
      // Submit with attachments
      append({
        content: input,
        role: 'user',
        experimental_attachments: attachments,
      });
      setInput('');
    } else {
      // Use default handleSubmit for text-only messages
      handleSubmit(e);
    }
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
    await saveEditedMessage(messageId, editText, messages, {
      currentChatId,
      setCurrentChatId,
      setMessages,
      setEditingMessageId,
      setEditText,
      reload,
      setSidebarRefreshTrigger,
      setIsSaving,
    });
  };

  const onSelectChat = async (chat: ChatHistory) => {
    await handleSelectChat(chat, {
      setMessages,
      setCurrentChatId,
      setLastSavedMessageCount,
      setEditingMessageId,
      setEditText
    });
  };

  const onChatDeleted = (deletedChatId: string) => {
    handleChatDeleted(deletedChatId, currentChatId, setCurrentChatId);
  };

  const onNewChat = () => {
    handleNewChat({
      setMessages,
      setCurrentChatId,
      setEditingMessageId,
      setEditText,
      setLastSavedMessageCount
    });
  };

  const copyToClipboardHandler = async (text: string) => {
    await copyToClipboard(text);
  };

  const shareTextHandler = async (text: string) => {
    await shareText(text);
  };

  return (
    <body className="flex min-h-screen w-full flex-col items-center justify-center">
      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectChat={onSelectChat}
        onNewChat={onNewChat}
        currentChatId={currentChatId || undefined}
        onChatDeleted={onChatDeleted}
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
                        onCopy={copyToClipboardHandler}
                        onShare={shareTextHandler}
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
              className="mb-4 flex w-full flex-col gap-3"
            >
              {/* Image Upload Component */}
              <ImageUpload onImageAdd={handleImageUpload} images={uploadedImages} onImageRemove={handleImageRemove} />
              
              {/* Input Row */}
              <div className="flex w-full flex-row items-center gap-3">
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
              </div>
            </form>
          </div>
        </>
      </main>
    </body>
  );
}
