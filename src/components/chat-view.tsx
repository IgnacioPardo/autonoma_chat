"use client";

import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import ChatMessages from "~/components/chat-messages";
import ChatInput from "~/components/chat-input";
import LoadingIndicator from "~/components/loading-indicator";
import { useState, useEffect, useRef, useCallback } from "react";
// import type { Attachment } from "ai";
import type { ChatHistory } from "~/lib/chat-history";
import { saveChatAfterMessage, processFileAttachments } from "~/lib/chat-utils";
import { saveEditedMessage } from "~/lib/message-edit";
import { copyToClipboard, shareText } from "~/lib/clipboard-utils";
import { toastUtils } from "~/lib/toast-utils";

interface ChatViewProps {
  chatId?: string | null;
  onChatIdChange?: (chatId: string | null) => void;
  onSidebarRefreshTrigger?: () => void;
  onSavingStateChange?: (isSaving: boolean) => void;
  shouldReplaceUrl?: boolean; // Whether to replace URL when new chat is created
}

export default function ChatView({
  chatId,
  onChatIdChange,
  onSidebarRefreshTrigger,
  onSavingStateChange,
  shouldReplaceUrl = false,
}: ChatViewProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Use ref to always have the latest chatId in callbacks
  const currentChatIdRef = useRef<string | null>(chatId ?? null);
  const messagesRef = useRef<ReturnType<typeof useChat>["messages"]>([]);
  const isLoadingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  const {
    messages,
    input,
    handleSubmit,
    setMessages,
    reload,
    append,
    setInput,
    isLoading,
  } = useChat({
    // Custom fetch to completely clean toolInvocations before sending to /api/chat only
    fetch: async (input, init) => {
      const isApIChatRequest =
        typeof input === "string" &&
        input.includes("/api/chat") &&
        !input.includes("/api/chats");

      if (isApIChatRequest && init?.body && typeof init.body === "string") {
        try {
          type Data = {
            messages?: Array<{
              toolInvocations?: unknown;
              role?: string;
              [key: string]: unknown;
            }>;
          };

          const data: Data = JSON.parse(init.body) as Data;

          if (data.messages && Array.isArray(data.messages)) {
            const cleanedMessages = data.messages.map((message) => {
              if ("toolInvocations" in message) {
                console.log(
                  `Frontend: Removing toolInvocations from ${message.role ?? "unknown"} message for stream processing`,
                );
                const { toolInvocations: _toolInvocations, ...cleanMessage } =
                  message;
                return cleanMessage;
              }
              return message;
            });

            console.log(
              "Frontend: Cleaned messages for /api/chat:",
              cleanedMessages.length,
            );

            init.body = JSON.stringify({ ...data, messages: cleanedMessages });
          }
        } catch (e) {
          console.warn(
            "Failed to parse request body for toolInvocation cleaning:",
            e,
          );
        }
      }

      return fetch(input, init);
    },
    onFinish: (message) => {
      console.log("=== onFinish: Assistant response completed ===");

      // Convert any generated images from toolInvocations to regular attachments
      if (message.toolInvocations && message.toolInvocations.length > 0) {
        console.log("Converting toolInvocations to attachments...");

        interface GeneratedImageAttachment {
          name: string;
          contentType: string;
          url: string;
          cloudinaryPublicId?: string;
          metadata: {
            prompt?: string;
            size?: string;
            quality?: string;
            isGenerated: boolean;
          };
        }

        const generatedImages: GeneratedImageAttachment[] = [];
        message.toolInvocations.forEach((invocation, invIndex) => {
          if (
            invocation.toolName === "generateImage" &&
            invocation.state === "result" &&
            "result" in invocation
          ) {
            const result = invocation.result as {
              success?: boolean;
              imageUrl?: string;
              cloudinaryPublicId?: string;
              prompt?: string;
              size?: string;
              quality?: string;
            };
            if (result.success && result.imageUrl) {
              const promptSource = result.prompt ?? "image";
              const promptForFilename = String(promptSource)
                .substring(0, 50)
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .replace(/\s+/g, "-")
                .toLowerCase();

              generatedImages.push({
                name: `generated-image-${promptForFilename}-${invIndex + 1}.png`,
                contentType: "image/png",
                url: result.imageUrl,
                cloudinaryPublicId: result.cloudinaryPublicId,
                metadata: {
                  prompt: result.prompt,
                  size: result.size,
                  quality: result.quality,
                  isGenerated: true,
                },
              });
            }
          }
        });

        if (generatedImages.length > 0) {
          console.log(
            "Adding generated images as attachments:",
            generatedImages.length,
          );

          const updatedMessage = {
            ...message,
            content:
              message.content.trim() ||
              `Generated ${generatedImages.length} image${generatedImages.length > 1 ? "s" : ""}`,
            experimental_attachments: (
              message.experimental_attachments ?? []
            ).concat(generatedImages),
            toolInvocations: undefined,
          };

          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0 && newMessages[lastIndex]?.id === message.id) {
              newMessages[lastIndex] = updatedMessage;
            }

            setTimeout(() => {
              console.log("🔄 Saving conversation with generated images...");
              (async () => {
                try {
                  await saveChatAndUpdateUrl(newMessages);
                  console.log(
                    "✅ Conversation with generated images saved successfully",
                  );
                } catch (error) {
                  console.error(
                    "❌ Error saving conversation with generated images:",
                    error,
                  );
                  toastUtils.apiError(error, "Error al guardar el chat");
                }
              })().catch(console.error);
            }, 100);

            return newMessages;
          });
        } else {
          console.log(
            "No generated images found, but saving assistant message with toolInvocations",
          );
          pendingSaveRef.current = true;
        }
      } else {
        console.log("No toolInvocations found in assistant message");
        pendingSaveRef.current = true;
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);

      if (
        error.message.includes("413") ||
        error.message.toLowerCase().includes("payload too large")
      ) {
        toastUtils.error(
          "Los archivos adjuntos son demasiado grandes. Intenta reducir el tamaño o número de archivos.",
        );
      } else if (error.message.includes("Attachments too large")) {
        toastUtils.error(
          "Los archivos adjuntos exceden el límite de 20MB. Por favor, reduce el tamaño de los archivos.",
        );
      } else if (error.message.includes("An error occurred")) {
        console.warn(
          "Stream error detected, this may be related to tool processing.",
        );
        toastUtils.error(
          "Error en el procesamiento. La conversación puede continuar normalmente.",
        );
      } else {
        toastUtils.apiError(error, "Error al enviar el mensaje");
      }
    },
  });

  // Load chat when chatId changes
  useEffect(() => {
    if (chatId) {
      console.log("Loading chat:", chatId);
      setIsLoadingChat(true);
      // Load chat messages from the API
      fetch(`/api/chats/${chatId}`)
        .then((res) => res.json())
        .then((chat: ChatHistory) => {
          if (chat.messages) {
            // Convert database messages to AI SDK format
            const convertedMessages = chat.messages.map((msg) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant" | "system",
              content: msg.content,
              createdAt: new Date(msg.createdAt),
              experimental_attachments: msg.attachments?.map((att) => ({
                name: att.name,
                contentType: att.contentType,
                url: att.url,
              })),
            }));
            setMessages(convertedMessages);
          }
        })
        .catch((error) => {
          console.error("Error loading chat:", error);
          toastUtils.error("Error al cargar el chat");
        })
        .finally(() => {
          setIsLoadingChat(false);
        });
    } else {
      // Clear messages if no chatId
      setMessages([]);
      setIsLoadingChat(false);
    }
  }, [chatId, setMessages]);

  // Helper function to save chat and handle URL replacement
  const saveChatAndUpdateUrl = useCallback(async (messagesData: Message[]) => {
    const wasNewChat = !currentChatIdRef.current;

    try {
      await saveChatAfterMessage(messagesData, {
        currentChatId: currentChatIdRef.current,
        setCurrentChatId: (newChatId: string | null) => {
          // Update the ref immediately
          currentChatIdRef.current = newChatId;

          // Call the parent callback
          if (onChatIdChange) {
            onChatIdChange(newChatId);
          }

          // Replace URL if this was a new chat and we're on the home page
          if (wasNewChat && newChatId && shouldReplaceUrl) {
            console.log("🔄 Replacing URL with new chat ID:", newChatId);
            window.history.replaceState({}, "", `/chat/${newChatId}`);
          }
        },
        setSidebarRefreshTrigger: onSidebarRefreshTrigger ?? (() => {
          // Empty function fallback
        }),
        setIsSaving: onSavingStateChange ?? (() => {
          // Empty function fallback
        }),
      });

      return true;
    } catch (error) {
      console.error("❌ Error saving chat:", error);
      toastUtils.apiError(error, "Error al guardar el chat");
      return false;
    }
  }, [onChatIdChange, onSidebarRefreshTrigger, onSavingStateChange, shouldReplaceUrl]);

  useEffect(() => {
    const wasLoading = isLoadingRef.current;
    const isNowLoading = isLoading;
    isLoadingRef.current = isLoading;

    if (wasLoading && !isNowLoading && pendingSaveRef.current) {
      pendingSaveRef.current = false;

      const lastMessage = messages[messages.length - 1];
      const hasGeneratedAttachments =
        lastMessage?.experimental_attachments?.some(
          (att) =>
            att &&
            typeof att === "object" &&
            "metadata" in att &&
            att.metadata &&
            typeof att.metadata === "object" &&
            "isGenerated" in att.metadata &&
            att.metadata.isGenerated === true,
        );

      if (hasGeneratedAttachments) {
        console.log(
          "🔄 Generated images already saved in onFinish, skipping duplicate save",
        );
        return;
      }

      setTimeout(() => {
        (async () => {
          try {
            await saveChatAndUpdateUrl(messages);
            console.log("✅ Complete conversation saved successfully");
          } catch (error) {
            console.error("❌ Error saving complete conversation:", error);
            toastUtils.apiError(error, "Error al guardar el chat");
          }
        })().catch(console.error);
      }, 100);
    }
  }, [isLoading, messages, onChatIdChange, onSidebarRefreshTrigger, onSavingStateChange, saveChatAndUpdateUrl]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentChatIdRef.current = chatId ?? null;
  }, [chatId]);

  

  const handleImageUpload = (file: File) => {
    console.log("Adding image to upload queue:", file.name, file.type, file.size);
    setUploadedImages((prev) => [...prev, file]);
  };

  const handleImageRemove = (index: number) => {
    console.log("Removing image at index:", index);
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() && uploadedImages.length === 0) return;

    if (uploadedImages.length > 0) {
      console.log("Processing images for attachment...");
      const attachments = await processFileAttachments(uploadedImages);

      const messageToSend = {
        content: input ?? "Archivo enviado",
        role: "user" as const,
        experimental_attachments: attachments,
      };

      void append(messageToSend);
      setInput("");
      setUploadedImages([]);
    } else {
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
    const wasNewChat = !currentChatIdRef.current;
    
    try {
      await saveEditedMessage(messageId, editText, messages, {
        currentChatId: chatId ?? null,
        setCurrentChatId: (newChatId: string | null) => {
          // Update the ref immediately
          currentChatIdRef.current = newChatId;
          
          // Call the parent callback
          if (onChatIdChange) {
            onChatIdChange(newChatId);
          }
          
          // Replace URL if this was a new chat and we're on the home page
          if (wasNewChat && newChatId && shouldReplaceUrl) {
            console.log("🔄 Replacing URL with new chat ID after edit:", newChatId);
            window.history.replaceState({}, "", `/chat/${newChatId}`);
          }
        },
        setMessages,
        setEditingMessageId,
        setEditText,
        reload,
        setSidebarRefreshTrigger: onSidebarRefreshTrigger ?? (() => {
          // Empty function fallback
        }),
        setIsSaving: onSavingStateChange ?? (() => {
          // Empty function fallback
        }),
      });
      toastUtils.success("Mensaje editado correctamente");
    } catch (error) {
      toastUtils.apiError(error, "Error al editar el mensaje");
    }
  };

  const copyToClipboardHandler = async (text: string) => {
    await copyToClipboard(text);
  };

  const shareTextHandler = async (text: string) => {
    await shareText(text);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex h-full w-full flex-col relative">
      {/* Fixed loading indicator for chat loading - doesn't affect layout */}
      {isLoadingChat && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in duration-200">
          <LoadingIndicator isLoading={true} />
        </div>
      )}
      
      <main className="pb-safe animate-in fade-in z-1 flex h-full w-full flex-col items-center justify-start overflow-hidden duration-300">
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
      </main>

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
  );
}
