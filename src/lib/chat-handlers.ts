import type { Message } from "ai";
import type { ChatHistory } from "./chat-history";
import { getChatById } from "./chat-history";
import { toastUtils } from "./toast-utils";

export interface ChatStateHandlers {
  setMessages: (messages: Message[]) => void;
  setCurrentChatId: (id: string | null) => void;
  setEditingMessageId: (id: string | null) => void;
  setEditText: (text: string) => void;
}

/**
 * Handles selecting and loading a chat from history
 */
export async function handleSelectChat(
  chat: ChatHistory,
  handlers: ChatStateHandlers,
): Promise<void> {
  const { setMessages, setCurrentChatId } = handlers;

  try {
    console.log("Loading chat with attachments:", chat.id);

    // Always fetch the full chat data from the API to ensure attachments are included
    const fullChat = await getChatById(chat.id);

    console.log("Full chat loaded from API:", {
      id: fullChat.id,
      messageCount: fullChat.messages.length,
      messagesWithAttachments: fullChat.messages.map((m) => ({
        role: m.role,
        content: m.content.substring(0, 30) + "...",
        attachmentCount: m.attachments?.length ?? 0,
        attachmentDetails:
          m.attachments?.map((att) => ({
            name: att.name,
            contentType: att.contentType,
            urlLength: att.url?.length ?? 0,
          })) ?? [],
      })),
    });

    // Convert ChatHistory messages to the format expected by useChat
    const convertedMessages: Message[] = fullChat.messages.map((msg) => {
      const baseMessage: Message = {
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: new Date(msg.createdAt),
      };

      // Separate generated images from regular attachments
      const generatedImages =
        msg.attachments?.filter(
          (att) =>
            att.name.startsWith("generated-image-") &&
            att.contentType === "image/png",
        ) ?? [];

      const regularAttachments =
        msg.attachments?.filter(
          (att) =>
            !att.name.startsWith("generated-image-") ||
            att.contentType !== "image/png",
        ) ?? [];

      // Convert regular attachments to experimental_attachments
      if (regularAttachments.length > 0) {
        baseMessage.experimental_attachments = regularAttachments.map(
          (att) => ({
            name: att.name,
            url: att.url,
            contentType: att.contentType,
          }),
        );
      }

      // Convert generated images back to toolInvocations
      if (generatedImages.length > 0) {
        baseMessage.toolInvocations = generatedImages.map((att) => {
          // Extract prompt from filename: "generated-image-{prompt}-{index}.png"
          let extractedPrompt = "Generated image";
          const namePartsMatch = /^generated-image-(.+)-\d+\.png$/.exec(
            att.name,
          );
          if (namePartsMatch?.[1]) {
            extractedPrompt = namePartsMatch[1].replace(/-/g, " ");
          }

          return {
            toolCallId: att.name
              .replace(/^generated-image-/, "")
              .replace(/\.png$/, ""),
            toolName: "generateImage",
            args: {
              prompt: extractedPrompt,
            },
            result: {
              success: true,
              imageUrl: att.url,
              prompt: extractedPrompt,
              size: "1024x1024",
              quality: "standard",
            },
            state: "result" as const,
          };
        });
      }

      return baseMessage;
    });

    console.log(
      "Converted messages with attachments:",
      convertedMessages.map((m) => ({
        role: m.role,
        content: m.content.substring(0, 30) + "...",
        hasAttachments: !!m.experimental_attachments?.length,
        attachmentCount: m.experimental_attachments?.length ?? 0,
        attachmentDetails:
          m.experimental_attachments?.map((att) => ({
            name: att.name,
            contentType: att.contentType,
            urlLength: att.url?.length ?? 0,
          })) ?? [],
      })),
    );

    setMessages(convertedMessages);
    setCurrentChatId(fullChat.id);
  } catch (error) {
    console.error("Error loading chat:", error);
    toastUtils.apiError(error, "Error al cargar el chat");
  }
}

/**
 * Handles when a chat is deleted, resetting state if it was the current chat
 */
export function handleChatDeleted(
  deletedChatId: string,
  currentChatId: string | null,
  setCurrentChatId: (id: string | null) => void,
): void {
  // If the deleted chat was the current one, reset to new chat state
  if (deletedChatId === currentChatId) {
    setCurrentChatId(null);
    // Don't clear messages here as the user might still be in a conversation
  }
}

/**
 * Handles creating a new chat, resetting all state
 */
export function handleNewChat(handlers: ChatStateHandlers): void {
  const { setMessages, setCurrentChatId, setEditingMessageId, setEditText } =
    handlers;

  setMessages([]);
  setCurrentChatId(null);
  setEditingMessageId(null);
  setEditText("");
}
