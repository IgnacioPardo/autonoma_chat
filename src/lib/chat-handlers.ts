import type { Message } from 'ai';
import type { ChatHistory } from './chat-history';

export interface ChatStateHandlers {
  setMessages: (messages: Message[]) => void;
  setCurrentChatId: (id: string | null) => void;
  setLastSavedMessageCount: (count: number) => void;
  setEditingMessageId: (id: string | null) => void;
  setEditText: (text: string) => void;
}

/**
 * Handles selecting and loading a chat from history
 */
export async function handleSelectChat(
  chat: ChatHistory, 
  handlers: ChatStateHandlers
): Promise<void> {
  const { setMessages, setCurrentChatId, setLastSavedMessageCount } = handlers;
  
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
    setLastSavedMessageCount(convertedMessages.length); // Update saved count
  } catch (error) {
    console.error('Error loading chat:', error);
  }
}

/**
 * Handles when a chat is deleted, resetting state if it was the current chat
 */
export function handleChatDeleted(
  deletedChatId: string,
  currentChatId: string | null,
  setCurrentChatId: (id: string | null) => void
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
  const { 
    setMessages, 
    setCurrentChatId, 
    setEditingMessageId, 
    setEditText, 
    setLastSavedMessageCount 
  } = handlers;
  
  setMessages([]);
  setCurrentChatId(null);
  setEditingMessageId(null);
  setEditText("");
  setLastSavedMessageCount(0); // Reset saved count
}
