"use client";

import { useChat } from "@ai-sdk/react";
import ChatSidebar from "~/components/chat-sidebar";
import NavBar from "~/components/navbar";
import ChatMessages from "~/components/chat-messages";
import ChatInput from "~/components/chat-input";
import AuthGuard from "~/components/auth-guard";
import { useState, useEffect, useRef } from 'react';
import type { Attachment } from 'ai';
import type { ChatHistory } from '~/lib/chat-history';
import { saveChatAfterMessage, processFileAttachments } from '~/lib/chat-utils';
import { saveEditedMessage } from '~/lib/message-edit';
import { copyToClipboard, shareText } from '~/lib/clipboard-utils';
import { handleSelectChat, handleChatDeleted, handleNewChat } from '~/lib/chat-handlers';
import { toastUtils } from '~/lib/toast-utils';

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
  // Refs to hold current state values for callbacks
  const messagesRef = useRef<ReturnType<typeof useChat>['messages']>([]);
  const isLoadingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  const { messages, input, handleSubmit, setMessages, reload, append, setInput, isLoading } = useChat({
    onFinish: (message) => {
      console.log('=== onFinish: Assistant response completed ===');
      console.log('Assistant message:', {
        role: message.role,
        content: message.content.substring(0, 30) + '...'
      });
      
      // Mark that we have a pending save
      // The useEffect will handle the actual saving when loading finishes
      pendingSaveRef.current = true;
      console.log('🔄 Marked conversation for saving when loading finishes');
    },
    onError: (error) => {
      console.error('Chat error:', error);
      
      // Handle specific error types
      if (error.message.includes('413') || error.message.toLowerCase().includes('payload too large')) {
        toastUtils.error('Los archivos adjuntos son demasiado grandes. Intenta reducir el tamaño o número de archivos.');
      } else if (error.message.includes('Attachments too large')) {
        toastUtils.error('Los archivos adjuntos exceden el límite de 20MB. Por favor, reduce el tamaño de los archivos.');
      } else {
        toastUtils.apiError(error, 'Error al enviar el mensaje');
      }
    }
  });  
  useEffect(() => {
    const wasLoading = isLoadingRef.current;
    const isNowLoading = isLoading;
    isLoadingRef.current = isLoading;
    
    // If we just finished loading (was loading, now not loading)
    // and we have a pending save, save the complete conversation
    if (wasLoading && !isNowLoading && pendingSaveRef.current) {
      pendingSaveRef.current = false;
      
      console.log('=== Loading finished, saving complete conversation ===');
      console.log('Final messages count:', messages.length);
      
      const finalMessages = messages.map((msg, i) => ({
        index: i,
        role: msg.role,
        content: msg.content.substring(0, 50) + '...',
        hasAttachments: !!msg.experimental_attachments?.length,
        attachmentCount: msg.experimental_attachments?.length ?? 0
      }));
      console.log('Final messages:', finalMessages);
      
      // Save the complete conversation
      setTimeout(() => {
        (async () => {
          try {
            await saveChatAfterMessage(messages, {
              currentChatId: currentChatIdRef.current,
              setCurrentChatId,
              setSidebarRefreshTrigger,
              setIsSaving
            });
            console.log('✅ Complete conversation saved successfully');
          } catch (error) {
            console.error('❌ Error saving complete conversation:', error);
            toastUtils.apiError(error, 'Error al guardar el chat');
          }
        })().catch(console.error);
      }, 100);
    }
  }, [isLoading, messages]);
  
  // Keep the refs in sync with state
  useEffect(() => {
    messagesRef.current = messages;
    console.log('=== Messages state updated ===');
    console.log('Messages count:', messages.length);
    console.log('Messages with attachments:', messages.map((m, i) => ({
      index: i,
      role: m.role,
      content: m.content.substring(0, 30) + '...',
      hasAttachments: !!m.experimental_attachments?.length,
      attachmentCount: m.experimental_attachments?.length ?? 0
    })));
  }, [messages]);

  useEffect(() => {
    currentChatIdRef.current = currentChatId;
    // console.log('=== currentChatId state changed ===');
    // console.log('Updated currentChatIdRef to:', currentChatId);
    // console.log('Ref now contains:', currentChatIdRef.current);
  }, [currentChatId]);

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
      const attachments = await processFileAttachments(uploadedImages);
      console.log('Processed attachments:', attachments.map((a: Attachment) => ({ 
        name: a.name, 
        urlLength: a.url.length,
        contentType: a.contentType 
      })));

      console.log('About to call append with attachments...');
      console.log('Attachments structure:', JSON.stringify(attachments.map((a: Attachment) => ({
        name: a.name,
        urlLength: a.url.length,
        urlStart: a.url.substring(0, 50),
        contentType: a.contentType
      })), null, 2));
      
      // Submit with attachments
      const messageToSend = {
        content: input ?? "Archivo enviado", // Provide fallback text if input is empty
        role: 'user' as const,
        experimental_attachments: attachments,
      };
      
      console.log('=== MESSAGE TO SEND ===');
      console.log('Message to send:', {
        content: messageToSend.content,
        role: messageToSend.role,
        attachmentCount: messageToSend.experimental_attachments.length,
        attachmentDetails: messageToSend.experimental_attachments.map(att => ({
          name: att.name,
          contentType: att.contentType,
          urlLength: att.url?.length ?? 0
        }))
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
    try {
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
      toastUtils.success('Mensaje editado correctamente');
    } catch (error) {
      toastUtils.apiError(error, 'Error al editar el mensaje');
    }
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

  // Wrapper for handleInputChange to work with textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Just update the input state directly since useChat hook manages it
    setInput(e.target.value);
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
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
        <div className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat z-0 scale-110 blur-sm animate-in fade-in duration-300"></div> 
        
        {/* NavBar */}
        <NavBar 
          onOpenSidebar={() => setSidebarOpen(true)}
          isSaving={isSaving}
        />

        <main className="flex min-h-screen w-5/6 sm:w-4/5 md:w-2/3 flex-col items-center justify-start overflow-y-auto overflow-x-hidden pb-safe animate-in fade-in duration-300">
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            editingMessageId={editingMessageId}
            editText={editText}
            setEditText={setEditText}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            copyToClipboardHandler={copyToClipboardHandler}
            shareTextHandler={shareTextHandler}
          />
          
          <div className="w-full pb-4 sm:pb-8 animate-in fade-in duration-300">
            <ChatInput
              input={input}
              handleInputChange={handleTextareaChange}
              handleFormSubmit={handleFormSubmit}
              handleSubmit={handleSubmit}
              uploadedImages={uploadedImages}
              handleImageUpload={handleImageUpload}
              handleImageRemove={handleImageRemove}
              setInput={setInput}
              setUploadedImages={setUploadedImages}
              processFileAttachments={processFileAttachments}
              append={append}
              messages={messages}
            />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
