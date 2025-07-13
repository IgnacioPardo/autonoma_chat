import { Send, ImagePlus, X, FileText, BarChart3, File, AudioLines } from 'lucide-react';
import Image from 'next/image';
import type { Message, Attachment } from 'ai';
import { useRef } from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import VoiceInput from './voice-input';
import { useSpeech } from '../hooks/use-speech';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  uploadedImages: File[];
  handleImageUpload: (file: File) => void;
  handleImageRemove: (index: number) => void;
  setInput: (value: string) => void;
  setUploadedImages: React.Dispatch<React.SetStateAction<File[]>>;
  processFileAttachments: (files: File[]) => Promise<Attachment[]>;
  append: (message: { content: string; role: 'user'; experimental_attachments: Attachment[] }) => void;
  messages: Message[];
}

export default function ChatInput({
  input,
  handleInputChange,
  handleFormSubmit,
  handleSubmit,
  uploadedImages,
  handleImageUpload,
  handleImageRemove,
  setInput,
  setUploadedImages,
  processFileAttachments,
  append,
  messages
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice functionality
  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    isSupported,
  } = useSpeech();

  const handleVoiceTranscript = (text: string) => {
    setInput(text);
    // Auto-submit if there's transcribed text
    if (text.trim()) {
      const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>;
      setTimeout(() => {
        void handleSubmit(formEvent);
      }, 100);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total
      
      // Calculate current total size
      const currentSize = uploadedImages.reduce((total, file) => total + file.size, 0);
      
      // Process each selected file
      Array.from(files).forEach(file => {
        // Check individual file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`El archivo "${file.name}" es demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). El tamaño máximo es 5MB.`, {
            duration: 6000
          });
          return;
        }
        
        // Check total size limit
        if (currentSize + file.size > MAX_TOTAL_SIZE) {
          toast.error(`Agregando "${file.name}" excedería el límite total de 10MB. Tamaño actual: ${(currentSize / 1024 / 1024).toFixed(2)}MB`, {
            duration: 6000
          });
          return;
        }
        
        // Accept images, CSV, Markdown, and PDF files
        const isValidFile = file.type.startsWith('image/') || 
                           file.type === 'text/csv' || 
                           file.name.endsWith('.csv') ||
                           file.type === 'text/markdown' || 
                           file.name.endsWith('.md') ||
                           file.type === 'application/pdf' ||
                           file.name.endsWith('.pdf');
        
        if (isValidFile) {
          handleImageUpload(file);
          console.log('File added:', file.name, file.type);
          toast.success(`Archivo agregado: ${file.name}`, { duration: 3000 });
        } else {
          toast.error(`Tipo de archivo no soportado: ${file.name}. Solo se permiten imágenes, archivos CSV, Markdown y PDF.`, {
            duration: 5000
          });
        }
      });
    }
    
    // Reset input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return null; // Will show image preview
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      return <BarChart3 size={32} className="text-green-600" />;
    } else if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
      return <FileText size={32} className="text-blue-600" />;
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return <File size={32} className="text-red-600" />;
    }
    return <FileText size={32} className="text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Estado para controlar el hover del mini-orb
  const [isMiniOrbHovered, setIsMiniOrbHovered] = useState(false);

  return (
    <>
      {/* Background Blur behind input - solo visible cuando hay mensajes */}
      {messages.length > 0 && (
        <div 
          className="fixed bottom-0 w-full h-[140px] backdrop-blur-xs mask-gradient z-[30] animate-in fade-in duration-300"
        ></div>
      )}
      
      {/* Input Form - posición dinámica basada en si hay mensajes */}
      <div className={`z-[40] fixed w-5/6 sm:w-4/5 md:w-2/3 p-4 transition-all duration-1000 ease-in-out ${
        messages.length === 0 
          ? "bottom-2/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
          : "bottom-0 left-1/2 transform -translate-x-1/2"
      }`}>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.csv,.md,.markdown,.pdf,text/csv,text/markdown,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        
        {/* File previews */}
        {uploadedImages.length > 0 && (
          <div className="mb-3 animate-in fade-in duration-300">
            {/* File previews */}
            <div className="flex flex-wrap gap-2 mb-3 animate-in fade-in duration-300">
              {uploadedImages.map((file, index) => (
                <div key={index} className="relative group animate-in fade-in duration-300">
                  {file.type.startsWith('image/') ? (
                    // Image preview
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                      unoptimized // Necesario para URLs de blob
                    />
                  ) : (
                    // File icon preview
                    <div className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border border-gray-300 bg-gray-50 p-2">
                      {getFileIcon(file)}
                      <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                        {file.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* File info tooltip */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="truncate">{file.name}</div>
                    <div>{formatFileSize(file.size)}</div>
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => handleImageRemove(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Eliminar archivo"
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Size indicator and progress bar - only show when files are uploaded */}
        {uploadedImages.length > 0 && (
          <div className="mb-3 animate-in fade-in duration-300">
            {/* Size indicator */}
            <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
              <span>{uploadedImages.length} archivo{uploadedImages.length > 1 ? 's' : ''}</span>
              <span>
                {formatFileSize(uploadedImages.reduce((total, file) => total + file.size, 0))} / 10MB
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${
                  uploadedImages.reduce((total, file) => total + file.size, 0) > 8 * 1024 * 1024
                    ? 'bg-red-500' 
                    : uploadedImages.reduce((total, file) => total + file.size, 0) > 6 * 1024 * 1024
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (uploadedImages.reduce((total, file) => total + file.size, 0) / (10 * 1024 * 1024)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        <form
          onSubmit={
            // If there are no messages, wait 200ms before submitting to allow transition to bottom
            messages.length === 0 
              ? (e) => {
                  e.preventDefault();
                  setTimeout(() => { 
                    void handleFormSubmit(e); 
                  }, 200);
                } 
              : (e) => { 
                  void handleFormSubmit(e); 
                }
          }
          className="mb-4 flex w-full flex-col gap-3"
        >
          {/* Input Row */}
          <div className="flex w-full flex-row items-center gap-0 bg-white/80 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Mini Orb Voice Chat Button */}
            <div 
              className="relative flex items-center w-14 h-14 group/mini-orb hover:w-full hover:h-full transition-all duration-300 overflow-hidden cursor-pointer animate-in fade-in"
              onMouseEnter={() => setIsMiniOrbHovered(true)}
              onMouseLeave={() => setIsMiniOrbHovered(false)}
            >
              <button
                type="button"
                onClick={() => window.location.href = '/voice-chat'}
                className="mini-orb flex items-center justify-start w-10 h-10 rounded-4xl border-2 border-purple-400 bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:shadow-xl  overflow-hidden group-hover/mini-orb:w-1/2 group-hover/mini-orb:h-12  group-hover/mini-orb:rounded-lg group-hover/mini-orb:border-0 absolute left-1 z-10 pl-5 cursor-pointer gap-4 animate-in fade-in"
                title="Voice Chat"
                style={{ transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)' }}
              >
                {/* <AudioLines size={20} className="text-white" /> */}
                <span
                  className="whitespace-nowrap text-white text-md opacity-0 group-hover/mini-orb:opacity-100 group-hover/mini-orb:animate-in group-hover/mini-orb:fade-in group-hover/mini-orb:slide-in-right transition-all duration-300 max-w-0 group-hover/mini-orb:max-w-xs"
                  style={{ transition: 'max-width 0.3s, opacity 0.3s' }}
                >
                  Entrar a conversación por voz
                </span>
              </button>
            </div>
            {/* Textarea */}
            <div className="flex-1 flex items-center h-full">
              <textarea
                className={`
                  min-h-[56px] max-h-40 w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-4 text-base resize-none transition-opacity duration-300 group-hover/mini-orb:opacity-0 group-hover/mini-orb:animate-out group-hover/mini-orb:fade-out animate-in fade-in
                `}
                value={isMiniOrbHovered ? '' : (input)}
                placeholder={isMiniOrbHovered ? '' : (messages.length === 0 ? "Comienza una conversación..." : "Escribe tu mensaje...")}
                onChange={handleInputChange}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                rows={1}
                style={{ fontSize: '16px', lineHeight: '1.5' }}
                onInput={(e) => {
                  // Auto-resize textarea based on content
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!input.trim() && uploadedImages.length === 0) return;
                    if (uploadedImages.length > 0) {
                      void (async () => {
                        const attachments = await processFileAttachments(uploadedImages);
                        void append({
                          content: input ?? "Imagen enviada",
                          role: 'user',
                          experimental_attachments: attachments,
                        });
                        setInput('');
                        setUploadedImages([]);
                        const textarea = e.target as HTMLTextAreaElement;
                        textarea.style.height = 'auto';
                      })();
                    } else {
                      // Crear un evento sintético compatible con FormEvent<HTMLFormElement>
                      const syntheticEvent = {
                        // preventDefault: () => {},
                        target: null
                      } as unknown as React.FormEvent<HTMLFormElement>;
                      handleSubmit(syntheticEvent);
                    }
                  }
                }}
              />
            </div>
            {/* Mic Icon */}
            <div className="flex items-center justify-center w-14 h-14">
              <VoiceInput
                isListening={isListening}
                isSupported={isSupported}
                transcript={transcript}
                onStartListening={startListening}
                onStopListening={stopListening}
                onTranscriptSubmit={handleVoiceTranscript}
              />
            </div>
            {/* Image Upload Icon */}
            <div className="flex items-center justify-center w-14 h-14">
              <button
                type="button"
                onClick={handleImageButtonClick}
                className="p-2 text-primary-violet hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Agregar archivos (imágenes, CSV, Markdown, PDF)"
              >
                <ImagePlus size={22} />
              </button>
            </div>
            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() && uploadedImages.length === 0}
              className="from-primary-blue to-primary-violet border-border-violet flex min-h-[56px] items-center justify-center rounded-2xl border bg-gradient-to-b px-4 py-4 whitespace-nowrap text-white shadow-lg transition-shadow duration-200 hover:shadow-xl gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-end ml-2"
            >
              <Send size={20} />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
