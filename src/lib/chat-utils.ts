import type { Message } from 'ai';
import { saveChatHistory, updateChatHistory, generateChatTitle } from './chat-history';

export interface ChatSaveOptions {
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  setSidebarRefreshTrigger: (fn: (prev: number) => number) => void;
  setIsSaving: (saving: boolean) => void;
}

/**
 * Helper function to save chat after key events
 * Handles both new chat creation and existing chat updates
 */
export async function saveChatAfterMessage(
  messagesToSave: Message[], 
  options: ChatSaveOptions
): Promise<void> {
  const { currentChatId, setCurrentChatId, setSidebarRefreshTrigger, setIsSaving } = options;
  
//   console.log('=== saveChatAfterMessage called ===');
//   console.log('Messages to save:', messagesToSave.map(m => ({ role: m.role, content: m.content.substring(0, 20) + '...' })));
//   console.log('Target chat ID:', currentChatId);
  
  if (messagesToSave.length === 0) {
    // console.log('Skipping save - no messages');
    return;
  }
  
  setIsSaving(true);
  try {
    if (currentChatId) {
    //   console.log('Updating existing chat:', currentChatId);
      // Verify the chat still exists before updating
      try {
        await updateChatHistory(currentChatId, messagesToSave);
        // console.log('Successfully updated chat:', currentChatId);
        
        // If this is the first AI response (messages length is 2), regenerate title
        if (messagesToSave.length === 2 && messagesToSave[1]?.role === 'assistant') {
        //   console.log('Generating title for 2-message chat');
          try {
            const newTitle = await generateChatTitle(messagesToSave);
            // console.log('Generated new title:', newTitle);
            // Update the chat with the new title
            const response = await fetch(`/api/chats/${currentChatId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: newTitle })
            });
            if (!response.ok) {
            //   console.warn('Failed to update chat title');
            } else {
            //   console.log('Successfully updated chat title');
            }
          } catch (titleError) {
            console.warn('Failed to generate new title:', titleError);
          }
        }
      } catch (updateError) {
        // If update fails, create a new chat instead
        console.log('Chat update failed, creating new chat instead. Error:', updateError);
        const savedChat = await saveChatHistory(messagesToSave);
        // console.log('Created new chat after update failure:', savedChat.id);
        setCurrentChatId(savedChat.id);
      }
    } else {
    //   console.log('No current chat ID, creating new chat');
      const savedChat = await saveChatHistory(messagesToSave);
    //   console.log('Created completely new chat:', savedChat.id);
      setCurrentChatId(savedChat.id);
      setSidebarRefreshTrigger(prev => prev + 1); // Trigger sidebar refresh
    }
  } catch (error) {
    console.error('Error saving chat:', error);
  } finally {
    setTimeout(() => setIsSaving(false), 500); // Small delay to show saving state
  }
}

/**
 * Converts uploaded files to base64 attachments for multimodal chat
 */
export async function processImageAttachments(files: File[]): Promise<{ name: string; url: string; contentType: string }[]> {
  return Promise.all(
    files.map(async (file) => {
      return new Promise<{ name: string; url: string; contentType: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            url: reader.result as string,
            contentType: file.type, // Add the content type
          });
        };
        reader.readAsDataURL(file);
      });
    })
  );
}
