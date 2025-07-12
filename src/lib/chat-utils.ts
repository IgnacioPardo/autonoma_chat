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
 * Supports images, text files, code files, and various document formats
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
      const fileType = determineFileType(file);

      let processedFile: Attachment;

      if (fileType === 'image') {
        // Compress and resize images
        processedFile = await compressImage(file, IMAGE_QUALITY, MAX_IMAGE_DIMENSION);
      } else if (fileType === 'pdf') {
        // Process PDF files
        processedFile = await processPdfFile(file);
      } else {
        // Process all other text-based files normally
        processedFile = await processTextFile(file, fileType);
      }

      processedFiles.push(processedFile);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  }

  return processedFiles;
}

/**
 * Determines the file type based on MIME type and file extension
 */
function determineFileType(file: File): 'image' | 'csv' | 'markdown' | 'pdf' | 'json' | 'yaml' | 'xml' | 'txt' | 'code' | 'config' | 'log' | 'other' {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  // Images
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  // PDF
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'pdf';
  }

  // Data formats
  if (mimeType === 'text/csv' || fileName.endsWith('.csv')) {
    return 'csv';
  }
  
  if (mimeType === 'application/json' || fileName.endsWith('.json') || fileName.endsWith('.jsonl') || fileName.endsWith('.ndjson')) {
    return 'json';
  }

  if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
    return 'yaml';
  }

  if (mimeType === 'application/xml' || mimeType === 'text/xml' || fileName.endsWith('.xml')) {
    return 'xml';
  }

  // Documentation formats
  if (mimeType === 'text/markdown' || fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
    return 'markdown';
  }

  if (fileName.endsWith('.rst') || fileName.endsWith('.adoc') || fileName.endsWith('.asciidoc')) {
    return 'markdown'; // Treat as markdown-like
  }

  // Code files
  const codeExtensions = ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.py', '.html', '.htm', '.css', '.sql', '.sh', '.bash', '.ps1', '.php', '.rb', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rs', '.swift', '.kt', '.scala', '.r', '.m', '.pl', '.lua', '.dart', '.vue', '.svelte'];
  if (codeExtensions.some(ext => fileName.endsWith(ext))) {
    return 'code';
  }

  // Configuration files
  const configExtensions = ['.toml', '.ini', '.conf', '.config', '.env', '.properties'];
  const configFiles = ['dockerfile', 'makefile', 'rakefile', 'gemfile', 'podfile', '.gitignore', '.dockerignore', '.eslintrc', '.prettierrc', '.babelrc', 'tsconfig.json', 'package.json', 'composer.json', 'pom.xml', 'build.gradle'];
  if (configExtensions.some(ext => fileName.endsWith(ext)) || configFiles.some(name => fileName.includes(name))) {
    return 'config';
  }

  // Log files
  if (fileName.endsWith('.log') || fileName.endsWith('.logs')) {
    return 'log';
  }

  // Plain text files
  if (mimeType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.text')) {
    return 'txt';
  }

  // If it's any text/* MIME type, treat as text
  if (mimeType.startsWith('text/')) {
    return 'txt';
  }

  return 'other';
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
              name: file.name, // Ensure name is always present
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
 * Processes PDF files by extracting text content via API
 */
async function processPdfFile(file: File): Promise<Attachment> {
  console.log('Sending PDF to extract endpoint:', file.name, file.type, file.size);

  try {
    // Send PDF to backend for text extraction
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/pdf/extract', {
      method: 'POST',
      body: formData,
    });

    console.log('PDF extract response status:', response.status, response.statusText);

    if (response.ok) {
      const result = await response.json() as { text: string; info: { pages: number } };
      console.log('PDF extraction successful:', result.info);
      
      // Create a data URL with the extracted text
      const textBlob = new Blob([result.text], { type: 'text/plain' });
      const textDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(textBlob);
      });

      return {
        name: file.name, // Ensure name is always present
        url: textDataUrl, // This contains the extracted text
        contentType: 'application/pdf',
        size: file.size,
        fileType: 'pdf',
      };
    } else {
      const errorText = await response.text();
      console.warn('PDF extract API failed, using fallback:', response.status, response.statusText, errorText);
      // Fall through to fallback processing
    }
  } catch (error) {
    console.warn('PDF processing failed, using fallback:', error);
    // Fall through to fallback processing
  }

  // Fallback: return PDF as binary data URL
  console.log('Using fallback PDF processing for:', file.name);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name, // Ensure name is always present
        url: reader.result as string,
        contentType: file.type,
        size: file.size,
        fileType: 'pdf',
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Processes text-based files (everything except images and PDFs)
 */
async function processTextFile(file: File, fileType: 'csv' | 'markdown' | 'json' | 'yaml' | 'xml' | 'txt' | 'code' | 'config' | 'log' | 'other'): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name, // Ensure name is always present
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
