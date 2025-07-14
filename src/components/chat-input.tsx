'use client';

import { Send, ImagePlus, X, FileText, BarChart3, File, AudioLines } from "lucide-react";
import Image from "next/image";
import type { Message, Attachment } from "ai";
import { useRef } from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import VoiceInput from "./voice-input";
import { useSpeech } from "../hooks/use-speech";
import { useMediaQuery } from "~/hooks/use-media-query";

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
  append: (message: {
    content: string;
    role: "user";
    experimental_attachments: Attachment[];
  }) => void;
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
  messages,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Media query for mobile
  const isMobile = useMediaQuery("mobile");

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
      const formEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      }) as unknown as React.FormEvent<HTMLFormElement>;
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
      const currentSize = uploadedImages.reduce(
        (total, file) => total + file.size,
        0,
      );

      // Process each selected file
      Array.from(files).forEach((file) => {
        // Check individual file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(
            `El archivo "${file.name}" es demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). El tamaño máximo es 5MB.`,
            {
              duration: 6000,
            },
          );
          return;
        }

        // Check total size limit
        if (currentSize + file.size > MAX_TOTAL_SIZE) {
          toast.error(
            `Agregando "${file.name}" excedería el límite total de 10MB. Tamaño actual: ${(currentSize / 1024 / 1024).toFixed(2)}MB`,
            {
              duration: 6000,
            },
          );
          return;
        }

        // Accept images, CSV, Markdown, and PDF files
        const isValidFile =
          file.type.startsWith("image/") ||
          file.type === "text/csv" ||
          file.name.endsWith(".csv") ||
          file.type === "text/markdown" ||
          file.name.endsWith(".md") ||
          file.type === "application/pdf" ||
          file.name.endsWith(".pdf");

        if (isValidFile) {
          handleImageUpload(file);
          console.log("File added:", file.name, file.type);
          toast.success(`Archivo agregado: ${file.name}`, { duration: 3000 });
        } else {
          toast.error(
            `Tipo de archivo no soportado: ${file.name}. Solo se permiten imágenes, archivos CSV, Markdown y PDF.`,
            {
              duration: 5000,
            },
          );
        }
      });
    }

    // Reset input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return null; // Will show image preview
    } else if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      return <BarChart3 size={32} className="text-green-600" />;
    } else if (
      file.type === "text/markdown" ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".markdown")
    ) {
      return <FileText size={32} className="text-blue-600" />;
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      return <File size={32} className="text-red-600" />;
    }
    return <FileText size={32} className="text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Estado para controlar el hover del mini-orb
  const [isMiniOrbHovered, setIsMiniOrbHovered] = useState(false);

  return (
    <>
      {/* Background Blur behind input - solo visible cuando hay mensajes */}
      {messages.length > 0 && (
        <div className="mask-gradient animate-in fade-in fixed bottom-0 z-[30] h-[140px] w-full backdrop-blur-sm duration-300"></div>
      )}

      {/* Input Form - posición dinámica basada en si hay mensajes y archivos subidos */}
      <div
        className={`fixed z-[40] w-full p-4 transition-all duration-1000 ease-in-out sm:w-full md:w-2/3 ${
          messages.length === 0
            ? uploadedImages.length > 0
              ? "bottom-1/4 left-1/2 -translate-x-1/2 transform" // Lower when files are uploaded and no messages
              : "bottom-2/5 left-1/2 -translate-x-1/2 -translate-y-1/2 transform" // Center when no files and no messages
            : "bottom-0 left-1/2 -translate-x-1/2 transform" // Bottom when there are messages
        }`}
      >
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
          <div className="animate-in fade-in mb-3 duration-300">
            {/* File previews */}
            <div className="animate-in fade-in mb-3 flex flex-wrap gap-2 duration-300">
              {uploadedImages.map((file, index) => (
                <div
                  key={index}
                  className="group animate-in fade-in relative duration-300"
                >
                  {file.type.startsWith("image/") ? (
                    // Image preview
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-lg border border-gray-300 object-cover"
                      unoptimized // Necesario para URLs de blob
                    />
                  ) : (
                    // File icon preview
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border border-gray-300 bg-gray-50 p-2">
                      {getFileIcon(file)}
                      <span className="mt-1 w-full truncate text-center text-xs text-gray-600">
                        {file.name.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* File info tooltip */}
                  <div className="bg-opacity-75 absolute right-0 bottom-0 left-0 rounded-b-lg bg-black p-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="truncate">{file.name}</div>
                    <div>{formatFileSize(file.size)}</div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleImageRemove(index)}
                    className="absolute -top-2 -right-2 cursor-pointer rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
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
          <div className="animate-in fade-in mb-3 duration-300">
            {/* Size indicator */}
            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
              <span>
                {uploadedImages.length} archivo
                {uploadedImages.length > 1 ? "s" : ""}
              </span>
              <span>
                {formatFileSize(
                  uploadedImages.reduce((total, file) => total + file.size, 0),
                )}{" "}
                / 10MB
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full rounded-full bg-gray-200">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  uploadedImages.reduce((total, file) => total + file.size, 0) >
                  8 * 1024 * 1024
                    ? "bg-red-500"
                    : uploadedImages.reduce(
                          (total, file) => total + file.size,
                          0,
                        ) >
                        6 * 1024 * 1024
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min(100, (uploadedImages.reduce((total, file) => total + file.size, 0) / (10 * 1024 * 1024)) * 100)}%`,
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
          <div className="flex w-full flex-row items-center overflow-hidden rounded-2xl border border-gray-200 bg-white/80 shadow-lg">
            {/* Mini Orb Voice Chat Button */}
            <div
              className="group/mini-orb animate-in fade-in relative flex h-14 w-14 cursor-pointer items-center overflow-hidden transition-all duration-300 hover:h-full hover:w-full"
              onMouseEnter={() => setIsMiniOrbHovered(true)}
              onMouseLeave={() => setIsMiniOrbHovered(false)}
            >
              <button
                type="button"
                onClick={() => (window.location.href = "/voice-chat")}
                className="mini-orb animate-in fade-in absolute left-1 z-10 flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-4xl border-2 border-purple-400 bg-gradient-to-br from-purple-500 to-blue-500 group-hover/mini-orb:h-12 group-hover/mini-orb:w-2/3 group-hover/mini-orb:justify-start group-hover/mini-orb:pl-5 group-hover/mini-orb:rounded-lg group-hover/mini-orb:border-0 hover:from-purple-600 hover:to-blue-600 hover:shadow-xl"
                title="Voice Chat"
                style={{ transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)" }}
              >
                <AudioLines 
                  size={18} 
                  className="text-white shrink-0 transition-all duration-300 group-hover/mini-orb:mr-2" 
                />
                <span
                  className="text-md group-hover/mini-orb:animate-in group-hover/mini-orb:fade-in group-hover/mini-orb:slide-in-right max-w-0 whitespace-nowrap text-white opacity-0 transition-all duration-300 group-hover/mini-orb:max-w-xs group-hover/mini-orb:opacity-100"
                  style={{ transition: "max-width 0.3s, opacity 0.3s" }}
                >
                  Entrar a conversación por voz
                </span>
              </button>
            </div>
            {/* Textarea */}
            <div
              className={` ${!isListening ? "flex-1" : "hidden"} flex h-full items-center`}
            >
              <textarea
                className={`group-hover/mini-orb:animate-out group-hover/mini-orb:fade-out animate-in fade-in overflow-y max-h-40 min-h-[56px] w-full resize-none overflow-x-auto border-0 bg-transparent px-2 py-4 text-xs whitespace-nowrap transition-opacity duration-300 group-hover/mini-orb:opacity-0 focus:ring-0 focus:outline-none sm:overflow-x-visible sm:text-base sm:whitespace-normal`}
                value={isMiniOrbHovered ? "" : input}
                placeholder={
                  isMobile ? "Escribe" :
                  (isMiniOrbHovered
                    ? ""
                    : messages.length === 0
                      ? "Comienza una conversación..."
                      : "Escribe tu mensaje...")
                }
                onChange={handleInputChange}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                rows={1}
                onInput={(_e) => {
                  // Auto-resize textarea based on content
                  // const target = e.target as HTMLTextAreaElement;
                  // target.style.height = 'auto';
                  // target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!input.trim() && uploadedImages.length === 0) return;
                    if (uploadedImages.length > 0) {
                      void (async () => {
                        const attachments =
                          await processFileAttachments(uploadedImages);
                        void append({
                          content: input ?? "Imagen enviada",
                          role: "user",
                          experimental_attachments: attachments,
                        });
                        setInput("");
                        setUploadedImages([]);
                        const textarea = e.target as HTMLTextAreaElement;
                        textarea.style.height = "auto";
                      })();
                    } else {
                      // Crear un evento sintético compatible con FormEvent<HTMLFormElement>
                      const syntheticEvent = {
                        // preventDefault: () => {},
                        target: null,
                      } as unknown as React.FormEvent<HTMLFormElement>;
                      handleSubmit(syntheticEvent);
                    }
                  }
                }}
              />
            </div>
            {/* Mic Icon */}
            <div
              className={` ${isListening ? "w-full flex-1" : "w-10"} flex h-10 items-center justify-start`}
            >
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
            <div className="flex h-10 w-10 items-center justify-center">
              <button
                type="button"
                onClick={handleImageButtonClick}
                className="text-primary-violet cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
                title="Agregar archivos (imágenes, CSV, Markdown, PDF)"
              >
                <ImagePlus size={22} />
              </button>
            </div>
            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() && uploadedImages.length === 0}
              className="from-primary-blue to-primary-violet border-border-violet ml-2 flex min-h-[56px] cursor-pointer items-center justify-center gap-2 self-end rounded-2xl border bg-gradient-to-b px-4 py-4 text-sm whitespace-nowrap text-white shadow-lg transition-shadow duration-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
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
