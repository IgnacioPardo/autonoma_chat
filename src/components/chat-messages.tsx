import Image from "next/image";
import Markdown from 'react-markdown';
import { Check, X, FileText, BarChart3, File } from 'lucide-react';
import MessageActions from './message-actions';
import LoadingIndicator from './loading-indicator';
import type { Message, Attachment as AIAttachment } from 'ai';
import type { Attachment } from '~/types/chat';
import { useRef, useEffect } from 'react';

interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  prompt?: string;
  size?: string;
  quality?: string;
  error?: string;
}

interface ImageGenerationArgs {
  prompt?: string;
  size?: string;
  quality?: string;
}

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Helper function to determine if attachment is an image
  const isImageAttachment = (attachment: AIAttachment | Attachment) => {
    return attachment.contentType?.startsWith('image/') ?? 
           /\.(jpg|jpeg|png|gif|webp|svg)$/i.exec(attachment.name ?? '') != null;
  };

  // Helper function to determine file type
  const getFileType = (attachment: AIAttachment | Attachment) => {
    // Use the fileType from the attachment if available (from our new processing)
    if ('fileType' in attachment && attachment.fileType && attachment.fileType !== 'other') {
      return attachment.fileType;
    }

    // Fallback to content type and extension detection for older attachments
    const fileName = attachment.name?.toLowerCase() ?? '';
    const mimeType = attachment.contentType?.toLowerCase() ?? '';

    if (isImageAttachment(attachment)) return 'image';
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf';
    if (mimeType === 'text/csv' || fileName.endsWith('.csv')) return 'csv';
    if (mimeType === 'text/markdown' || /\.(md|markdown)$/.exec(fileName)) return 'markdown';
    if (mimeType === 'application/json' || /\.(json|jsonl|ndjson)$/.exec(fileName)) return 'json';
    if (/\.(yml|yaml)$/.exec(fileName)) return 'yaml';
    if (mimeType.includes('xml') || fileName.endsWith('.xml')) return 'xml';
    if (mimeType === 'text/plain' || /\.(txt|text)$/.exec(fileName)) return 'txt';
    if (/\.(log|logs)$/.exec(fileName)) return 'log';

    // Code files
    const codeExtensions = /\.(js|mjs|jsx|ts|tsx|py|html|htm|css|sql|sh|bash|ps1|php|rb|java|c|cpp|h|hpp|cs|go|rs|swift|kt|scala|r|m|pl|lua|dart|vue|svelte)$/;
    if (codeExtensions.exec(fileName)) return 'code';

    // Config files
    const configExtensions = /\.(toml|ini|conf|config|env|properties)$/;
    const configFiles = /(dockerfile|makefile|rakefile|gemfile|podfile|\.gitignore|\.dockerignore|\.eslintrc|\.prettierrc|\.babelrc|tsconfig\.json|package\.json|composer\.json|pom\.xml|build\.gradle)/;
    if (configExtensions.exec(fileName) || configFiles.exec(fileName)) return 'config';

    return 'other';
  };

  // Helper function to get file icon
  const getFileIcon = (attachment: AIAttachment | Attachment) => {
    const fileType = getFileType(attachment);
    switch (fileType) {
      case 'csv':
        return <BarChart3 size={24} className="text-green-600" />;
      case 'markdown':
        return <FileText size={24} className="text-blue-600" />;
      case 'pdf':
        return <File size={24} className="text-red-600" />;
      case 'json':
        return <FileText size={24} className="text-yellow-600" />;
      case 'yaml':
        return <FileText size={24} className="text-purple-600" />;
      case 'xml':
        return <FileText size={24} className="text-orange-600" />;
      case 'code':
        return <FileText size={24} className="text-indigo-600" />;
      case 'config':
        return <FileText size={24} className="text-teal-600" />;
      case 'log':
        return <FileText size={24} className="text-gray-700" />;
      case 'txt':
        return <FileText size={24} className="text-gray-600" />;
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
    <div className="flex w-full h-full flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pt-6 pb-40 px-5 sm:px-0">
        <div className="flex flex-col space-y-6 sm:space-y-8">
        {messages.length === 0 ? (
          /* Welcome screen when no messages - positioned to work with dynamic input */
          // <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          //   <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">
          //     Autónoma Chat
          //   </h1>
          //   <p className="text-lg text-white/80 drop-shadow mb-8">
          //     ¿En qué puedo ayudarte hoy?
          //   </p>
          // </div>
          <></>

        ) : (
          messages.map((message) => {
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
            className={`flex w-full px-4 h-fit overflow-y-hidden overflow-x-hidden ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex flex-col h-fit space-y-1 min-w-0 ${
              message.role === "user" 
                ? "items-end max-w-[80%] sm:max-w-md lg:max-w-lg" 
                : "items-start max-w-[85%] sm:max-w-lg lg:max-w-2xl"
            }`}>
              {/* Text message bubble */}
              <div
                className={`group relative rounded-2xl break-words overflow-visible ${
                  // Special styling for messages with tool invocations (like image generation)
                  message.toolInvocations && message.toolInvocations.length > 0 && message.role === "assistant"
                  ? "bg-transparent border-none shadow-none backdrop-blur-bg-gradient-to-t none px-0 py-0"
                    // Special styling for user messages with only attachments (no text)
                    : !messageText.trim() && hasAttachments && message.role === "user"
                    ? "bg-transparent border-none shadow-none backdrop-blur-none px-0 py-0"
                    : message.role === "user"
                    ? "from-primary-blue to-primary-violet rounded-br-sm bg-gradient-to-b text-white px-4 py-3 min-w-[100px]"
                    : "rounded-bl-sm border border-gray-200 bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm px-4 py-3 min-w-[120px]"
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
                        className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Guardar cambios"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors cursor-pointer"
                        title="Cancelar edición"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal message display
                  <>
                    {/* Only show text container if there's actual text content */}
                    {messageText.trim() && (
                      <div
                        className={`prose prose-sm sm:prose-base max-w-none break-words ${
                          // Special styling for text content when there are tool invocations
                          message.toolInvocations && message.toolInvocations.length > 0 && message.role === "assistant"
                            ? "rounded-bl-sm border border-gray-200 bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm px-4 py-3 mb-4 [&_code]:bg-gray-100 [&_pre]:bg-gray-50 [&_code]:text-gray-800"
                            // Special styling for user text when there are attachments (create separate bubble)
                            : hasAttachments && message.role === "user"
                            ? "from-primary-blue to-primary-violet rounded-br-sm bg-gradient-to-b text-white px-4 py-3 mb-4 prose-invert [&_code]:bg-white/20 [&_pre]:bg-white/10 [&_code]:text-gray-100"
                            : message.role === "user" 
                            ? "prose-invert [&_code]:bg-white/20 [&_pre]:bg-white/10 [&_code]:text-gray-100" 
                            : "[&_code]:bg-gray-100 [&_pre]:bg-gray-50 [&_code]:text-gray-800"
                        }`}
                      >
                        <Markdown>
                          {messageText}
                        </Markdown>
                      </div>
                    )}

                    {/* Tool invocations - show generated images and other tool results */}
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                      <div className="mt-4 space-y-3 relative z-10">
                        {message.toolInvocations.map((toolInvocation, index) => {
                          if (toolInvocation.toolName === 'generateImage' && toolInvocation.state === 'result') {
                            const result = toolInvocation.result as ImageGenerationResult;
                            
                            if (result.success && result.imageUrl) {
                              // Check if it's a base64 data URL or external URL
                              const isBase64 = result.imageUrl.startsWith('data:');
                              
                              return (
                                <div key={index} className="rounded-xl overflow-visible border-2 border-gray-200 shadow-lg bg-white relative z-10">
                                  <div className="relative z-10">
                                    <Image
                                      src={result.imageUrl}
                                      alt={result.prompt ?? 'Generated image'}
                                      width={1024}
                                      height={1024}
                                      className="w-full h-auto object-cover rounded-t-lg"
                                      unoptimized={isBase64} // Only unoptimized for base64, let Next.js optimize Cloudinary URLs
                                    />
                                  </div>
                                  <div className="p-3 border-t relative z-10">
                                    <div className="text-xs text-gray-600 mb-1 break-words">
                                      <span className="font-medium">Prompt:</span> {result.prompt}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {result.size} • {result.quality} quality
                                    </div>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div key={index} className="rounded-xl border-2 border-red-200 bg-red-50 p-4 relative z-10">
                                  <div className="text-sm text-red-700 mb-2">
                                    <span className="font-medium">❌ Error generando imagen</span>
                                  </div>
                                  <div className="text-sm text-red-600 mb-2 break-words">
                                    {result.error ?? 'Error desconocido'}
                                  </div>
                                  {result.prompt && (
                                    <div className="text-xs text-red-600 mt-2 break-words bg-red-100 p-2 rounded">
                                      <span className="font-medium">Prompt:</span> {result.prompt}
                                    </div>
                                  )}
                                  <div className="mt-3 text-xs text-red-500">
                                    💡 Consejos: Verifica tu conexión a internet y la configuración de OpenAI API
                                  </div>
                                </div>
                              );
                            }
                          } else if (toolInvocation.toolName === 'generateImage' && toolInvocation.state === 'call') {
                            // Show loading state for image generation
                            const args = toolInvocation.args as ImageGenerationArgs;
                            return (
                              <div key={index} className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 relative z-10">
                                <div className="flex items-center gap-3">
                                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                  <div className="text-sm text-blue-700">
                                    Generando imagen...
                                  </div>
                                </div>
                                <div className="text-xs text-blue-600 mt-2 break-words">
                                  {args?.prompt && `Prompt: ${args.prompt}`}
                                </div>
                              </div>
                            );
                          }
                          
                          // Handle other tool types here in the future
                          return null;
                        })}
                      </div>
                    )}

                    {/* Botones de acción que aparecen al hacer hover */}

                    {/* Div to add space for  */}
                  </>
                )}
              </div>

              {
                !(message.toolInvocations && message.toolInvocations.length > 0 && message.role === "assistant") &&
                <MessageActions
                  messageText={messageText}
                  isUserMessage={message.role === "user"}
                  onCopy={copyToClipboardHandler}
                  onShare={shareTextHandler}
                  onEdit={message.role === "user" ? () => startEdit(message.id, messageText) : undefined}
                />
              }

              {/* Render attached files separately below the text */}
              {hasAttachments && (
                <div className={`flex flex-col gap-3 relative z-1 w-full ${message.role === "user" ? "items-end" : "items-start"}`}>
                  {message.experimental_attachments?.map((attachment, index) => {
                    const fileType = getFileType(attachment);
                    
                    if (fileType === 'image') {
                      // Check if this is a generated image
                      const isGeneratedImage = (attachment as { metadata?: { isGenerated?: boolean } }).metadata?.isGenerated === true;
                      const generationMetadata = (attachment as { metadata?: { prompt?: string; size?: string; quality?: string } }).metadata;
                      
                      // Render image attachments
                      return (
                        <div 
                          key={index} 
                          className={`rounded-xl overflow-hidden border-2 shadow-lg bg-white relative z-1 ${
                            isGeneratedImage ? 'border-gray-200' : 'border-gray-200'
                          }`}
                        >
                          <div className={isGeneratedImage ? 'p-0' : 'p-1'}>
                            <Image
                              src={attachment.url}
                              alt={attachment.name ?? `Image ${index + 1}`}
                              className="max-w-full h-auto relative z-1 rounded-t-lg"
                              width={isGeneratedImage ? 1024 : 300}
                              height={isGeneratedImage ? 1024 : 250}
                              style={{ 
                                maxHeight: isGeneratedImage ? 'auto' : '250px', 
                                maxWidth: isGeneratedImage ? '100%' : '300px', 
                                objectFit: isGeneratedImage ? 'cover' : 'contain'
                              }}
                              unoptimized={attachment.url.startsWith('data:')} // Only unoptimized for base64
                            />
                          </div>
                          
                          {/* Show generation info for generated images */}
                          {isGeneratedImage && generationMetadata?.prompt && (
                            <div className="p-3 border-t relative z-1">
                              <div className="text-xs text-gray-600 mb-1 break-words">
                                <span className="font-medium">Prompt:</span> {generationMetadata?.prompt ?? 'No prompt available'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {generationMetadata?.size ?? 'Unknown size'} • {generationMetadata?.quality ?? 'Unknown quality'} quality
                              </div>
                            </div>
                          )}
                          
                          {/* Show filename for regular uploaded images */}
                          {!isGeneratedImage && attachment.name && (
                            <div className="px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded-b-lg relative z-1">
                              {attachment.name}
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // Render non-image file attachments
                      // Only show content preview for CSV and Markdown, not PDFs
                      // Show content preview for text-based files (but not PDFs which can have weird content)
                      const showContentPreview = ['csv', 'markdown', 'json', 'yaml', 'xml', 'txt', 'code', 'config', 'log'].includes(fileType);
                      const textContent = showContentPreview ? extractTextContent(attachment.url) : null;
                      
                      return (
                        <div 
                          key={index} 
                          className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg bg-white p-3 relative z-1 max-w-sm"
                        >
                          {/* Header with icon and filename */}
                          <div className={`flex items-center gap-2 ${showContentPreview && textContent ? 'mb-2 pb-2 border-b border-gray-100' : ''}`}>
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
                          
                          {/* Content preview - only for CSV and Markdown files */}
                          {showContentPreview && textContent && (
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
        })
        )}
        <div ref={messagesEndRef} />
        {/* Loading indicator when assistant is typing - only show before streaming starts */}
        <LoadingIndicator isLoading={isLoading && !hasActiveStreamingOrGeneration(messages)} />
        </div>
      </div>
    </div>
  );

  // Helper function to check if there's active streaming or generation
  function hasActiveStreamingOrGeneration(messages: Message[]): boolean {
    if (messages.length === 0) return false;
    
    const lastMessage = messages[messages.length - 1];
    
    // If last message is from assistant and has content, streaming has started
    if (lastMessage?.role === 'assistant' && lastMessage?.content.trim()) {
      return true;
    }
    
    // If last message has tool invocations (image generation in progress)
    if (lastMessage?.toolInvocations && lastMessage?.toolInvocations.length > 0) {
      return true;
    }
    
    return false;
  }
}
