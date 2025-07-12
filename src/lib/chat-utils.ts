import type { Message } from 'ai';
import type { Attachment } from '~/types/chat';
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
 * Supports images, CSV, and Markdown files with compression and size limits
 */
export async function processFileAttachments(files: File[]): Promise<Attachment[]> {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
  const IMAGE_QUALITY = 0.8; // 80% quality for JPEG compression
  const MAX_IMAGE_DIMENSION = 1920; // Max width/height

  const processedFiles: Attachment[] = [];

  for (const file of files) {
    try {
      // Check file size limits
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Max size is 5MB.`);
        continue;
      }

      // Determine file type
      let fileType: 'image' | 'csv' | 'markdown' | 'other' = 'other';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        fileType = 'csv';
      } else if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
        fileType = 'markdown';
      }

      let processedFile: Attachment;

      if (fileType === 'image') {
        // Compress and resize images
        processedFile = await compressImage(file, IMAGE_QUALITY, MAX_IMAGE_DIMENSION);
      } else {
        // Process non-image files normally
        processedFile = await processNonImageFile(file, fileType);
      }

      processedFiles.push(processedFile);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  }

  return processedFiles;
}

/**
 * Compresses and resizes an image file
 */
async function compressImage(file: File, quality: number, maxDimension: number): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              url: reader.result as string,
              contentType: 'image/jpeg',
              size: blob.size,
              fileType: 'image',
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Processes non-image files (CSV, Markdown, etc.)
 */
async function processNonImageFile(file: File, fileType: 'csv' | 'markdown' | 'other'): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        url: reader.result as string,
        contentType: file.type,
        size: file.size,
        fileType: fileType,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Keep the old function name for backward compatibility
export const processImageAttachments = processFileAttachments;
