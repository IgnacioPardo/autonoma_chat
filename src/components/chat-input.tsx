import { Send, Pencil } from 'lucide-react';
import ImageUpload from './image-upload';
import type { Message } from 'ai';
import type { Attachment } from '~/types/chat';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  uploadedImages: File[];
  handleImageUpload: (file: File) => void;
  handleImageRemove: (index: number) => void;
  setInput: (value: string) => void;
  setUploadedImages: React.Dispatch<React.SetStateAction<File[]>>;
  processImageAttachments: (images: File[]) => Promise<Attachment[]>;
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
  processImageAttachments,
  append,
  messages
}: ChatInputProps) {
  return (
    <>
      {/* Background Blur behind input - solo visible cuando hay mensajes */}
      {messages.length > 0 && (
        <div 
          className="fixed bottom-0 w-full h-[140px] backdrop-blur-xs mask-gradient z-10"
        ></div>
      )}
      
      {/* Input Form - posición dinámica basada en si hay mensajes */}
      <div className={`z-10 fixed w-5/6 sm:w-4/5 md:w-2/3 p-4 transition-all duration-1000 ease-in-out ${
        messages.length === 0 
          ? "bottom-2/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
          : "bottom-0 left-1/2 transform -translate-x-1/2"
      }`}>
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
          {/* Image Upload Component */}
          <ImageUpload onImageAdd={handleImageUpload} images={uploadedImages} onImageRemove={handleImageRemove} />
          
          {/* Input Row */}
          <div className="flex w-full flex-row items-center gap-3">
            <div className="relative flex-1">
              <Pencil 
                size={18} 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-violet z-20 transition-colors duration-300" 
              />
              <input
                className={`
                  h-[56px] w-full rounded-2xl border border-gray-300 pl-12 pr-4 py-4 
                  shadow-sm backdrop-blur-xs transition-all duration-500 ease-in-out
                  focus:ring-primary-violet focus:border-transparent focus:ring-2 focus:outline-none
                  text-sm sm:text-base
                  ${messages.length === 0 
                    ? 'bg-white/75 border-gray-300/60 shadow-lg' 
                    : 'bg-white/40 border-gray-300/40 shadow-sm'
                  }
                `}
                value={input}
                placeholder={messages.length === 0 ? "Comienza una conversación..." : "Escribe tu mensaje..."}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('Enter pressed - triggering handleFormSubmit');
                    console.log('Current uploadedImages count:', uploadedImages.length);
                    
                    // Trigger the same logic as handleFormSubmit
                    if (!input.trim() && uploadedImages.length === 0) return;
                    
                    if (uploadedImages.length > 0) {
                      // Handle images like in handleFormSubmit
                      void (async () => {
                        console.log('Processing images for attachment (Enter)...');
                        const attachments = await processImageAttachments(uploadedImages);
                        console.log('Processed attachments (Enter):', attachments.map(a => ({ 
                          name: a.name, 
                          urlLength: a.url.length,
                          contentType: a.contentType 
                        })));
                        
                        void append({
                          content: input ?? "Imagen enviada",
                          role: 'user',
                          experimental_attachments: attachments,
                        });
                        
                        setInput('');
                        setUploadedImages([]);
                        console.log('Cleared form after sending (Enter)');
                      })();
                    } else {
                      // Handle text-only like normal - create a synthetic form event
                      const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>;
                      void handleSubmit(formEvent);
                    }
                  }
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() && uploadedImages.length === 0}
              className="from-primary-blue to-primary-violet border-border-violet flex h-[56px] items-center justify-center rounded-2xl border bg-gradient-to-b px-4 py-4 whitespace-nowrap text-white shadow-lg transition-shadow duration-200 hover:shadow-xl gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
