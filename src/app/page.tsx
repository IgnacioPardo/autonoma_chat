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
    onFinish: (message) => {
      
      // Use setTimeout to ensure messages state is updated
      setTimeout(() => {
        (async () => {
          // Use the ref to get the most up-to-date currentChatId
          const actualCurrentChatId = currentChatIdRef.current;
        
          const inputMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: 
              editingMessageId 
              ? editText.trim() ?? input 
              : ((
              messages && (messages.length > 0) && (messages[messages.length - 1]) && ((messages[messages.length - 1]) !== undefined) && ((messages[messages.length - 1])?.role === 'user') && messages[messages.length - 1]?.content
            )
              ? (messages[messages.length - 1]?.content) ?? input
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
              const msgIndex = messages.findIndex(m => m.id === msg.id);
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
        })().catch(console.error);
      }, 100);
    }
  });


  useEffect(() => {
    console.log(messages);
  }, [messages]);


  const handleImageUpload = (file: File) => {
    console.log('Adding image to upload queue:', file.name, file.type, file.size);
    setUploadedImages(prev => {
      const newImages = [...prev, file];
      console.log('Total images in queue:', newImages.length);
      return newImages;
    });
  };

  const handleImageRemove = (index: number) => {
    console.log('=== handleImageRemove called ===');
    console.log('Removing image at index:', index);
    console.log('Stack trace:', new Error().stack);
    setUploadedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      console.log('Images after removal:', newImages.length);
      return newImages;
    });
  };

  // Custom form submit handler to handle images
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() && uploadedImages.length === 0) return;
    
    console.log('Form submitted with:', { input: input.substring(0, 50) + '...', imagesCount: uploadedImages.length });
    
    if (uploadedImages.length > 0) {
      console.log('Processing images for attachment...');
      console.log('Images:', uploadedImages.map(img => ({ name: img.name, type: img.type, size: img.size })));
      
      // Process images for attachment
      const attachments = await processImageAttachments(uploadedImages);
      console.log('Processed attachments:', attachments.map(a => ({ 
        name: a.name, 
        urlLength: a.url.length,
        contentType: a.contentType 
      })));

      console.log('About to call append with attachments...');
      console.log('Attachments structure:', JSON.stringify(attachments.map(a => ({
        name: a.name,
        urlLength: a.url.length,
        urlStart: a.url.substring(0, 50),
        contentType: a.contentType
      })), null, 2));
      
      // Submit with attachments
      const messageToSend = {
        content: input ?? "Imagen enviada", // Provide fallback text if input is empty
        role: 'user' as const,
        experimental_attachments: attachments,
      };
      
      console.log('Message to send:', {
        content: messageToSend.content,
        role: messageToSend.role,
        attachmentCount: messageToSend.experimental_attachments.length
      });
      
      void append(messageToSend);
      
      // Clear form AFTER sending
      setInput('');
      setUploadedImages([]);
      console.log('Cleared form after sending');
      
    } else {
      console.log('Submitting text-only message...');
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
      setEditText
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
        currentChatId={currentChatId ?? undefined}
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
            // Check if message has attachments (images)
            const hasAttachments = message.experimental_attachments && message.experimental_attachments.length > 0;
            
            // Debug logging for attachments
            if (hasAttachments) {
              console.log('=== Rendering message with attachments ===');
              console.log('Message with attachments:', {
                messageId: message.id,
                role: message.role,
                content: message.content?.substring(0, 50) + '...',
                attachmentCount: message.experimental_attachments?.length,
                attachments: message.experimental_attachments?.map(a => ({
                  name: a.name,
                  urlStart: a.url?.substring(0, 30) + '...',
                  contentType: a.contentType
                }))
              });
            }

            return (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex flex-col gap-2 max-w-xs lg:max-w-md ${message.role === "user" ? "items-end" : "items-start"}`}>
                  {/* Text message bubble */}
                  <div
                    className={`group relative rounded-2xl px-4 py-3 ${
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
                              void saveEdit(message.id);
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

                  {/* Render attached images separately below the text */}
                  {hasAttachments && (
                    <div className={`flex flex-col gap-2 relative z-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
                      {message.experimental_attachments?.map((attachment, index) => (
                        <div 
                          key={index} 
                          className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg bg-white p-1 relative z-1"
                        >
                          <Image
                            src={attachment.url}
                            alt={attachment.name ?? `Image ${index + 1}`}
                            className="rounded-lg max-w-full h-auto relative z-1"
                            width={300}
                            height={250}
                            style={{ maxHeight: '250px', maxWidth: '300px', objectFit: 'contain' }}
                          />
                          {attachment.name && (
                            <div className="px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded-b-lg relative z-1">
                              {attachment.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
              className="fixed bottom-0 w-full h-[140px] backdrop-blur-xs mask-gradient z-10"
            ></div>
          )}
          
          {/* Input Form - posición dinámica basada en si hay mensajes */}
          <div className={`z-10 fixed w-5/6 sm:w-4/5 md:w-2/3 p-4 transition-all duration-1000 ease-in-out ${
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
                      setTimeout(() => { 
                        void handleFormSubmit(e); 
                      }, 200);
                    } 
                  : (e) => { 
                      void handleFormSubmit(e); 
                    }
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        console.log('Enter pressed - triggering handleFormSubmit');
                        console.log('Current uploadedImages count:', uploadedImages.length);
                        
                        // Trigger the same logic as handleFormSubmit
                        if (!input.trim() && uploadedImages.length === 0) return;
                        
                        if (uploadedImages.length > 0) {
                          // Handle images like in handleFormSubmit
                          void (async () => {
                            console.log('Processing images for attachment (Enter)...');
                            const attachments = await processImageAttachments(uploadedImages);
                            console.log('Processed attachments (Enter):', attachments.map(a => ({ 
                              name: a.name, 
                              urlLength: a.url.length,
                              contentType: a.contentType 
                            })));
                            
                            void append({
                              content: input ?? "Imagen enviada",
                              role: 'user',
                              experimental_attachments: attachments,
                            });
                            
                            setInput('');
                            setUploadedImages([]);
                            console.log('Cleared form after sending (Enter)');
                          })();
                        } else {
                          // Handle text-only like normal - create a synthetic form event
                          const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>;
                          void handleSubmit(formEvent);
                        }
                      }
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() && uploadedImages.length === 0}
                  className="from-primary-blue to-primary-violet border-border-violet flex h-[56px] items-center justify-center rounded-2xl border bg-gradient-to-b px-4 py-4 whitespace-nowrap text-white shadow-lg transition-shadow duration-200 hover:shadow-xl gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
