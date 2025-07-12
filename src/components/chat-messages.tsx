import Image from "next/image";
import Markdown from 'react-markdown';
import { Check, X, FileText, BarChart3 } from 'lucide-react';
import MessageActions from './message-actions';
import LoadingIndicator from './loading-indicator';
import type { Message, Attachment } from 'ai';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  editingMessageId: string | null;
  editText: string;
  setEditText: (text: string) => void;
  startEdit: (messageId: string, currentText: string) => void;
  saveEdit: (messageId: string) => void;
  cancelEdit: () => void;
  copyToClipboardHandler: (text: string) => Promise<void>;
  shareTextHandler: (text: string) => Promise<void>;
}

export default function ChatMessages({
  messages,
  isLoading,
  editingMessageId,
  editText,
  setEditText,
  startEdit,
  saveEdit,
  cancelEdit,
  copyToClipboardHandler,
  shareTextHandler
}: ChatMessagesProps) {
  
  // Helper function to determine if attachment is an image
  const isImageAttachment = (attachment: Attachment) => {
    return attachment.contentType?.startsWith('image/') ?? 
           attachment.name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) != null;
  };

  // Helper function to determine file type
  const getFileType = (attachment: Attachment) => {
    if (isImageAttachment(attachment)) return 'image';
    if (attachment.contentType === 'text/csv' || attachment.name?.endsWith('.csv') === true) return 'csv';
    if (attachment.contentType === 'text/markdown' || attachment.name?.match(/\.(md|markdown)$/i) != null) return 'markdown';
    return 'other';
  };

  // Helper function to get file icon
  const getFileIcon = (attachment: Attachment) => {
    const fileType = getFileType(attachment);
    switch (fileType) {
      case 'csv':
        return <BarChart3 size={24} className="text-green-600" />;
      case 'markdown':
        return <FileText size={24} className="text-blue-600" />;
      default:
        return <FileText size={24} className="text-gray-600" />;
    }
  };

  // Helper function to extract text content from data URL
  const extractTextContent = (dataUrl: string, maxLength = 150) => {
    try {
      // Extract base64 content and decode it
      const base64Content = dataUrl.split(',')[1];
      if (!base64Content) return '';
      
      const decodedContent = atob(base64Content);
      
      // Truncate and clean the content
      let content = decodedContent.substring(0, maxLength);
      if (decodedContent.length > maxLength) {
        content += '...';
      }
      
      // Remove any control characters and clean up
      content = content.replace(/[\x00-\x1F\x7F]/g, ' ').trim();
      
      return content;
    } catch (error) {
      console.error('Error extracting text content:', error);
      return '';
    }
  };
  return (
    <div className="flex w-full flex-col space-y-12 sm:space-y-8 pt-28 pb-40 overflow-x-hidden max-w-full">
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
            className={`flex w-full overflow-x-hidden ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex flex-col gap-2 max-w-xs lg:max-w-md w-full ${message.role === "user" ? "items-end" : "items-start"}`}>
              {/* Text message bubble */}
              <div
                className={`group relative rounded-2xl px-4 py-3 overflow-hidden break-words max-w-full ${
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
                      className="w-full max-w-full min-h-[80px] p-3 rounded-lg border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary-violet text-gray-800 bg-white text-xs sm:text-sm leading-relaxed break-words"
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
                      className={`prose prose-sm sm:prose-base max-w-none overflow-hidden break-words ${
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

              {/* Render attached files separately below the text */}
              {hasAttachments && (
                <div className={`flex flex-col gap-2 relative z-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
                  {message.experimental_attachments?.map((attachment, index) => {
                    const fileType = getFileType(attachment);
                    
                    if (fileType === 'image') {
                      // Render image attachments
                      return (
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
                      );
                    } else {
                      // Render text file attachments with content preview
                      const textContent = extractTextContent(attachment.url);
                      
                      return (
                        <div 
                          key={index} 
                          className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg bg-white p-3 relative z-1 max-w-sm"
                        >
                          {/* Header with icon and filename */}
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                            {getFileIcon(attachment)}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-700 truncate">
                                {attachment.name ?? `File ${index + 1}`}
                              </div>
                              <div className="text-xs text-gray-500 uppercase">
                                {fileType}
                              </div>
                            </div>
                          </div>
                          
                          {/* Content preview */}
                          {textContent && (
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border font-mono leading-relaxed">
                              {textContent}
                            </div>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Loading indicator when assistant is typing */}
      <LoadingIndicator isLoading={isLoading} />
    </div>
  );
}
