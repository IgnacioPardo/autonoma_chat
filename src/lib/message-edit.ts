import type { Message } from "ai";

export interface MessageEditOptions {
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  setEditingMessageId: (id: string | null) => void;
  setEditText: (text: string) => void;
  reload: () => Promise<string | null | undefined>;
  setSidebarRefreshTrigger: (
    value: number | ((prev: number) => number),
  ) => void;
  setIsSaving: (saving: boolean) => void;
}

/**
 * Handles saving an edited message and optionally triggering regeneration
 */
export async function saveEditedMessage(
  messageId: string,
  editText: string,
  messages: Message[],
  options: MessageEditOptions,
): Promise<void> {
  const {
    setMessages,
    setEditingMessageId,
    setEditText,
    reload,
    setSidebarRefreshTrigger,
    setIsSaving,
    setCurrentChatId,
  } = options;

  if (!editText.trim()) {
    setEditingMessageId(null);
    setEditText("");
    return;
  }

  setIsSaving(true);

  try {
    // Find the index of the edited message
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) {
      setIsSaving(false);
      return;
    }

    const originalMessage = messages[messageIndex];
    if (!originalMessage) {
      setIsSaving(false);
      return;
    }
    // Create the edited message with a NEW ID to avoid conflicts
    const editedMessage: Message = {
      id: crypto.randomUUID(), // NEW: Generate new ID to prevent conflicts
      role: originalMessage.role,
      content: editText,
      createdAt: new Date(), // NEW: Use current time for new branch
    };

    // Create new messages array: all messages up to (but not including) the edited one, plus the edited message
    const messagesBeforeEdit = messages.slice(0, messageIndex);
    const newMessages = [...messagesBeforeEdit, editedMessage];

    // Update the messages state first
    setMessages(newMessages);

    // Clear editing state
    setEditingMessageId(null);
    setEditText("");

    setCurrentChatId(null); // Reset current chat ID to create a new branch

    // Refresh sidebar to show the new chat
    setSidebarRefreshTrigger((prev) => prev + 1);

    // If this was a user message, trigger regeneration
    if (originalMessage.role === "user") {
      //   console.log('Triggering regeneration for user message edit in new chat:', savedChat.id);
      //   console.log('CRITICAL: About to call reload() - the response should save to chat:', savedChat.id);
      //   console.log('Make sure currentChatIdRef.current is updated before onFinish triggers');

      // Use a longer timeout to ensure the currentChatId state has updated in the useChat hook
      setTimeout(() => {
        // console.log('Calling reload() NOW - checking final state:');
        // console.log('- Expected target chat ID:', savedChat.id);
        // console.log('- State should be propagated by now');
        void reload();
      }, 500); // Increased timeout even more
    }
  } catch {
    // console.error('Error saving edited message:', error);
    // Don't create a fallback chat on error - just show the error
    // The user can try editing again
  } finally {
    setIsSaving(false);
  }
}
