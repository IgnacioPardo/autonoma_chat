"use client";

import { useChat } from "@ai-sdk/react";
import ChatSidebar from "~/components/chat-sidebar";
import NavBar from "~/components/navbar";
import ChatMessages from "~/components/chat-messages";
import ChatInput from "~/components/chat-input";
import { useState, useEffect, useRef } from 'react';
import type { Message, Attachment } from 'ai';
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
  
  // Keep the ref in sync with state
  useEffect(() => {
    currentChatIdRef.current = currentChatId;
    // console.log('=== currentChatId state changed ===');
    // console.log('Updated currentChatIdRef to:', currentChatId);
    // console.log('Ref now contains:', currentChatIdRef.current);
  }, [currentChatId]);

  const { messages, input, handleInputChange, handleSubmit, setMessages, reload, append, setInput, isLoading } = useChat({
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
          
          try {
            await saveChatAfterMessage(completeConversation, {
              currentChatId: actualCurrentChatId,
              setCurrentChatId,
              setSidebarRefreshTrigger,
              setIsSaving
            });
            // toastUtils.success('Chat guardado');
          } catch (error) {
            toastUtils.apiError(error, 'Error al guardar el chat');
          }
        })().catch((error) => {
          toastUtils.apiError(error, 'Error al procesar el mensaje');
        });
      }, 100);
    },
    onError: (error) => {
      toastUtils.apiError(error, 'Error al enviar el mensaje');
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

  return (
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
      <div className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat z-0 scale-110 blur-sm"></div> 
      
      {/* NavBar */}
      <NavBar 
        onOpenSidebar={() => setSidebarOpen(true)}
        isSaving={isSaving}
      />

      <main className="flex min-h-screen w-5/6 sm:w-4/5 md:w-2/3 flex-col items-center justify-start overflow-y-auto">
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
        
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
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
      </main>
    </div>
  );
}
