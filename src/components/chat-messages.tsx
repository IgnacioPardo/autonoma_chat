import Image from "next/image";
import Markdown from "react-markdown";
import {
  Check,
  X,
  FileText,
  BarChart3,
  File,
  Copy,
  Share2,
  Download,
} from "lucide-react";
import MessageActions from "./message-actions";
import LoadingIndicator from "./loading-indicator";
import type { Message, Attachment as AIAttachment } from "ai";
import type { Attachment } from "~/types/chat";
import { useRef, useEffect } from "react";

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
  readOnlyMode?: boolean;
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
  shareTextHandler,
  readOnlyMode = false,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Helper function to copy image to clipboard
  const copyImageToClipboard = async (imageUrl: string) => {
    try {
      if (imageUrl.startsWith("data:")) {
        // For base64 images
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      } else {
        // For external URLs, fetch and copy
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      }
      // You might want to show a toast notification here
      console.log("Image copied to clipboard");
    } catch (error) {
      console.error("Failed to copy image:", error);
      // Fallback: copy the image URL
      await copyToClipboardHandler(imageUrl);
    }
  };

  // Helper function to share image
  const shareImage = async (imageUrl: string, prompt?: string) => {
    try {
      if (navigator.share) {
        // For external URLs (Cloudinary)
        if (!imageUrl.startsWith("data:")) {
          await navigator.share({
            title: "Generated Image",
            text: prompt
              ? `Generated image: ${prompt}`
              : "Generated image from Autonoma Chat",
            url: imageUrl,
          });
        } else {
          // For base64, just share the text description and URL
          await shareTextHandler(
            prompt ? `Generated image: ${prompt}\n${imageUrl}` : imageUrl,
          );
        }
      } else {
        // Fallback: copy to clipboard
        await shareTextHandler(imageUrl);
      }
    } catch (error) {
      console.error("Failed to share image:", error);
      // Fallback: copy to clipboard
      await shareTextHandler(imageUrl);
    }
  };

  // Helper function to download image
  const downloadImage = async (imageUrl: string, prompt?: string) => {
    try {
      let blob: Blob;

      if (imageUrl.startsWith("data:")) {
        // For base64 images
        const response = await fetch(imageUrl);
        blob = await response.blob();
      } else {
        // For external URLs
        const response = await fetch(imageUrl);
        blob = await response.blob();
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Create filename from prompt
      const filename = prompt
        ? `generated-${prompt
            .substring(0, 30)
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .replace(/\s+/g, "-")
            .toLowerCase()}.png`
        : "generated-image.png";

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Helper function to determine if attachment is an image
  const isImageAttachment = (attachment: AIAttachment | Attachment) => {
    return (
      attachment.contentType?.startsWith("image/") ??
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.exec(attachment.name ?? "") != null
    );
  };

  // Helper function to determine file type
  const getFileType = (attachment: AIAttachment | Attachment) => {
    // Use the fileType from the attachment if available (from our new processing)
    if (
      "fileType" in attachment &&
      attachment.fileType &&
      attachment.fileType !== "other"
    ) {
      return attachment.fileType;
    }

    // Fallback to content type and extension detection for older attachments
    const fileName = attachment.name?.toLowerCase() ?? "";
    const mimeType = attachment.contentType?.toLowerCase() ?? "";

    if (isImageAttachment(attachment)) return "image";
    if (mimeType === "application/pdf" || fileName.endsWith(".pdf"))
      return "pdf";
    if (mimeType === "text/csv" || fileName.endsWith(".csv")) return "csv";
    if (mimeType === "text/markdown" || /\.(md|markdown)$/.exec(fileName))
      return "markdown";
    if (
      mimeType === "application/json" ||
      /\.(json|jsonl|ndjson)$/.exec(fileName)
    )
      return "json";
    if (/\.(yml|yaml)$/.exec(fileName)) return "yaml";
    if (mimeType.includes("xml") || fileName.endsWith(".xml")) return "xml";
    if (mimeType === "text/plain" || /\.(txt|text)$/.exec(fileName))
      return "txt";
    if (/\.(log|logs)$/.exec(fileName)) return "log";

    // Code files
    const codeExtensions =
      /\.(js|mjs|jsx|ts|tsx|py|html|htm|css|sql|sh|bash|ps1|php|rb|java|c|cpp|h|hpp|cs|go|rs|swift|kt|scala|r|m|pl|lua|dart|vue|svelte)$/;
    if (codeExtensions.exec(fileName)) return "code";

    // Config files
    const configExtensions = /\.(toml|ini|conf|config|env|properties)$/;
    const configFiles =
      /(dockerfile|makefile|rakefile|gemfile|podfile|\.gitignore|\.dockerignore|\.eslintrc|\.prettierrc|\.babelrc|tsconfig\.json|package\.json|composer\.json|pom\.xml|build\.gradle)/;
    if (configExtensions.exec(fileName) || configFiles.exec(fileName))
      return "config";

    return "other";
  };

  // Helper function to get file icon
  const getFileIcon = (attachment: AIAttachment | Attachment) => {
    const fileType = getFileType(attachment);
    switch (fileType) {
      case "csv":
        return <BarChart3 size={24} className="text-green-600" />;
      case "markdown":
        return <FileText size={24} className="text-blue-600" />;
      case "pdf":
        return <File size={24} className="text-red-600" />;
      case "json":
        return <FileText size={24} className="text-yellow-600" />;
      case "yaml":
        return <FileText size={24} className="text-purple-600" />;
      case "xml":
        return <FileText size={24} className="text-orange-600" />;
      case "code":
        return <FileText size={24} className="text-indigo-600" />;
      case "config":
        return <FileText size={24} className="text-teal-600" />;
      case "log":
        return <FileText size={24} className="text-gray-700" />;
      case "txt":
        return <FileText size={24} className="text-gray-600" />;
      default:
        return <FileText size={24} className="text-gray-600" />;
    }
  };

  // Helper function to extract text content from data URL
  const extractTextContent = (dataUrl: string, maxLength = 150) => {
    try {
      // Extract base64 content and decode it
      const base64Content = dataUrl.split(",")[1];
      if (!base64Content) return "";

      const decodedContent = atob(base64Content);

      // Truncate and clean the content
      let content = decodedContent.substring(0, maxLength);
      if (decodedContent.length > maxLength) {
        content += "...";
      }

      // Remove any control characters and clean up
      content = content.replace(/[\x00-\x1F\x7F]/g, " ").trim();

      return content;
    } catch (error) {
      console.error("Error extracting text content:", error);
      return "";
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth px-5 pt-6 pb-40 sm:px-0">
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
              const hasAttachments =
                message.experimental_attachments &&
                message.experimental_attachments.length > 0;

              // Debug logging for attachments
              if (hasAttachments) {
                console.log("=== Rendering message with attachments ===");
                console.log("Message with attachments:", {
                  messageId: message.id,
                  role: message.role,
                  content: message.content?.substring(0, 50) + "...",
                  attachmentCount: message.experimental_attachments?.length,
                  attachments: message.experimental_attachments?.map((a) => ({
                    name: a.name,
                    urlStart: a.url?.substring(0, 30) + "...",
                    contentType: a.contentType,
                  })),
                });
              }

              return (
                <div
                  key={message.id}
                  className={`animate-in fade-in slide-in-from-bottom-2 flex h-fit w-full overflow-x-hidden overflow-y-hidden px-4 duration-300 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex h-fit min-w-0 flex-col space-y-1 ${
                      message.role === "user"
                        ? "max-w-[80%] items-end sm:max-w-md lg:max-w-lg"
                        : "max-w-[85%] items-start sm:max-w-lg lg:max-w-2xl"
                    }`}
                  >
                    {/* Text message bubble */}
                    <div
                      className={`group relative overflow-visible rounded-2xl break-words transition-all duration-200 ease-out ${
                        // Special styling for messages with tool invocations (like image generation)
                        message.toolInvocations &&
                        message.toolInvocations.length > 0 &&
                        message.role === "assistant"
                          ? "backdrop-blur-bg-gradient-to-t none border-none bg-transparent px-0 py-0 shadow-none"
                          : // Special styling for user messages with only attachments (no text)
                            !messageText.trim() &&
                              hasAttachments &&
                              message.role === "user"
                            ? "border-none bg-transparent px-0 py-0 shadow-none backdrop-blur-none"
                            : message.role === "user"
                              ? "from-primary-blue to-primary-violet min-w-[100px] rounded-br-sm bg-gradient-to-b px-4 py-3 text-white shadow-lg hover:shadow-xl"
                              : "min-w-[120px] rounded-bl-sm border border-gray-200 bg-white/90 px-4 py-3 text-gray-800 shadow-sm backdrop-blur-sm hover:shadow-md"
                      }`}
                    >
                      {editingMessageId === message.id ? (
                        // Edit mode
                        <div className="w-full space-y-3">
                          <div className="relative">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  (e.metaKey || e.ctrlKey)
                                ) {
                                  e.preventDefault();
                                  void saveEdit(message.id);
                                }
                                if (e.key === "Escape") {
                                  e.preventDefault();
                                  cancelEdit();
                                }
                              }}
                              className="focus:border-primary-violet focus:ring-primary-violet/10 min-h-[120px] w-full resize-none rounded-2xl border-2 border-gray-200 bg-white/95 p-4 text-sm leading-relaxed break-words text-gray-800 shadow-sm backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 hover:shadow-md focus:ring-4 focus:outline-none"
                              placeholder="Escribe tu mensaje editado... (⌘/Ctrl + Enter para guardar, Esc para cancelar)"
                              autoFocus
                            />
                            <div className="pointer-events-none absolute right-3 bottom-3 text-xs text-gray-400">
                              {editText.length} caracteres
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={cancelEdit}
                              className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                              title="Cancelar edición"
                            >
                              <X size={14} />
                              Cancelar
                            </button>
                            <button
                              onClick={() => saveEdit(message.id)}
                              disabled={!editText.trim()}
                              className="from-primary-blue to-primary-violet flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300"
                              title="Guardar cambios"
                            >
                              <Check size={14} />
                              Guardar
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
                                message.toolInvocations &&
                                message.toolInvocations.length > 0 &&
                                message.role === "assistant"
                                  ? "mb-4 rounded-bl-sm border border-gray-200 bg-white/90 px-4 py-3 text-gray-800 shadow-sm backdrop-blur-sm [&_code]:bg-gray-100 [&_code]:text-gray-800 [&_pre]:bg-gray-50"
                                  : // Special styling for user text when there are attachments (create separate bubble)
                                    hasAttachments && message.role === "user"
                                    ? "from-primary-blue to-primary-violet prose-invert mb-4 rounded-br-sm bg-gradient-to-b px-4 py-3 text-white [&_code]:bg-white/20 [&_code]:text-gray-100 [&_pre]:bg-white/10"
                                    : message.role === "user"
                                      ? "prose-invert [&_code]:bg-white/20 [&_code]:text-gray-100 [&_pre]:bg-white/10"
                                      : "[&_code]:bg-gray-100 [&_code]:text-gray-800 [&_pre]:bg-gray-50"
                              }`}
                            >
                              <Markdown>{messageText}</Markdown>
                            </div>
                          )}

                          {/* Tool invocations - show generated images and other tool results */}
                          {message.toolInvocations &&
                            message.toolInvocations.length > 0 && (
                              <div className="relative z-10 mt-4 space-y-3">
                                {message.toolInvocations.map(
                                  (toolInvocation, index) => {
                                    if (
                                      toolInvocation.toolName ===
                                        "generateImage" &&
                                      toolInvocation.state === "result"
                                    ) {
                                      const result =
                                        toolInvocation.result as ImageGenerationResult;

                                      if (result.success && result.imageUrl) {
                                        // Check if it's a base64 data URL or external URL
                                        const isBase64 =
                                          result.imageUrl.startsWith("data:");

                                        return (
                                          <div
                                            key={index}
                                            className="animate-in fade-in slide-in-from-bottom-4 relative z-10 overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-lg transition-all duration-500 hover:shadow-xl"
                                          >
                                            <div className="group relative z-10">
                                              <Image
                                                src={result.imageUrl}
                                                alt={
                                                  result.prompt ??
                                                  "Generated image"
                                                }
                                                width={1024}
                                                height={1024}
                                                className="h-auto w-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
                                                unoptimized={isBase64} // Only unoptimized for base64, let Next.js optimize Cloudinary URLs
                                              />
                                            </div>
                                            <div className="relative z-10 border-t bg-white/95 p-3 backdrop-blur-sm">
                                              <div className="mb-1 text-xs break-words text-gray-600">
                                                <span className="font-medium">
                                                  Prompt:
                                                </span>{" "}
                                                {result.prompt}
                                              </div>
                                              <div className="mb-3 text-xs text-gray-500">
                                                {result.size} • {result.quality}{" "}
                                                quality
                                              </div>

                                              {/* Action buttons for generated images */}
                                              <div className="flex justify-end gap-2">
                                                <button
                                                  onClick={() =>
                                                    copyImageToClipboard(
                                                      result.imageUrl!,
                                                    )
                                                  }
                                                  className="cursor-pointer rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
                                                  title="Copiar imagen"
                                                >
                                                  <Copy size={14} />
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    shareImage(
                                                      result.imageUrl!,
                                                      result.prompt,
                                                    )
                                                  }
                                                  className="cursor-pointer rounded-lg bg-blue-100 p-2 text-blue-700 transition-colors hover:bg-blue-200"
                                                  title="Compartir imagen"
                                                >
                                                  <Share2 size={14} />
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    downloadImage(
                                                      result.imageUrl!,
                                                      result.prompt,
                                                    )
                                                  }
                                                  className="cursor-pointer rounded-lg bg-green-100 p-2 text-green-700 transition-colors hover:bg-green-200"
                                                  title="Descargar imagen"
                                                >
                                                  <Download size={14} />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div
                                            key={index}
                                            className="relative z-10 rounded-xl border-2 border-red-200 bg-red-50 p-4"
                                          >
                                            <div className="mb-2 text-sm text-red-700">
                                              <span className="font-medium">
                                                ❌ Error generando imagen
                                              </span>
                                            </div>
                                            <div className="mb-2 text-sm break-words text-red-600">
                                              {result.error ??
                                                "Error desconocido"}
                                            </div>
                                            {result.prompt && (
                                              <div className="mt-2 rounded bg-red-100 p-2 text-xs break-words text-red-600">
                                                <span className="font-medium">
                                                  Prompt:
                                                </span>{" "}
                                                {result.prompt}
                                              </div>
                                            )}
                                            <div className="mt-3 text-xs text-red-500">
                                              💡 Consejos: Verifica tu conexión
                                              a internet y la configuración de
                                              OpenAI API
                                            </div>
                                          </div>
                                        );
                                      }
                                    } else if (
                                      toolInvocation.toolName ===
                                        "generateImage" &&
                                      toolInvocation.state === "call"
                                    ) {
                                      // Show loading state for image generation
                                      const args =
                                        toolInvocation.args as ImageGenerationArgs;
                                      return (
                                        <div
                                          key={index}
                                          className="animate-in fade-in slide-in-from-bottom-2 relative z-10 rounded-xl border-2 border-blue-200 bg-blue-50/90 p-4 shadow-lg backdrop-blur-sm duration-300"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="relative">
                                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                              <div className="absolute inset-0 h-5 w-5 animate-ping rounded-full border border-blue-400 opacity-20"></div>
                                            </div>
                                            <div className="text-sm font-medium text-blue-700">
                                              Generando imagen con DALL-E 3...
                                            </div>
                                          </div>
                                          <div className="mt-3 rounded-md bg-blue-100/50 p-2 text-xs break-words text-blue-600">
                                            <div className="mb-1 font-medium">
                                              Prompt:
                                            </div>
                                            {args?.prompt
                                              ? `"${args.prompt}"`
                                              : "Creando imagen personalizada..."}
                                          </div>
                                          {/* <div className="mt-3 flex gap-1">
                                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-typing-pulse"></div>
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-typing-pulse-delay-1"></div>
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-typing-pulse-delay-2"></div>
                                </div> */}
                                        </div>
                                      );
                                    }

                                    // Handle other tool types here in the future
                                    return null;
                                  },
                                )}
                              </div>
                            )}

                          {/* Botones de acción que aparecen al hacer hover */}

                          {/* Div to add space for  */}
                        </>
                      )}
                    </div>

                    {/* Message Actions - only show if not in read-only mode */}
                    {!readOnlyMode && !(
                      message.toolInvocations &&
                      message.toolInvocations.length > 0 &&
                      message.role === "assistant"
                    ) && (
                      <MessageActions
                        messageText={messageText}
                        isUserMessage={message.role === "user"}
                        onCopy={copyToClipboardHandler}
                        onShare={shareTextHandler}
                        onEdit={
                          message.role === "user"
                            ? () => startEdit(message.id, messageText)
                            : undefined
                        }
                      />
                    )}

                    {/* Render attached files separately below the text */}
                    {hasAttachments && (
                      <div
                        className={`relative z-1 flex w-full flex-col gap-3 ${message.role === "user" ? "items-end" : "items-start"}`}
                      >
                        {message.experimental_attachments?.map(
                          (attachment, index) => {
                            const fileType = getFileType(attachment);

                            if (fileType === "image") {
                              // Check if this is a generated image
                              const isGeneratedImage =
                                (
                                  attachment as {
                                    metadata?: { isGenerated?: boolean };
                                  }
                                ).metadata?.isGenerated === true;
                              const generationMetadata = (
                                attachment as {
                                  metadata?: {
                                    prompt?: string;
                                    size?: string;
                                    quality?: string;
                                  };
                                }
                              ).metadata;

                              // Render image attachments
                              return (
                                <div
                                  key={index}
                                  className={`animate-in fade-in slide-in-from-bottom-2 group relative z-1 overflow-hidden rounded-xl border-2 bg-white shadow-lg transition-all duration-300 hover:shadow-xl ${
                                    isGeneratedImage
                                      ? "border-gray-200"
                                      : "border-gray-200"
                                  }`}
                                >
                                  <div
                                    className={isGeneratedImage ? "p-0" : "p-1"}
                                  >
                                    <Image
                                      src={attachment.url}
                                      alt={
                                        attachment.name ?? `Image ${index + 1}`
                                      }
                                      className="relative z-1 h-auto max-w-full rounded-t-lg transition-transform duration-300 group-hover:scale-[1.02]"
                                      width={isGeneratedImage ? 1024 : 300}
                                      height={isGeneratedImage ? 1024 : 250}
                                      style={{
                                        maxHeight: isGeneratedImage
                                          ? "auto"
                                          : "250px",
                                        maxWidth: isGeneratedImage
                                          ? "100%"
                                          : "300px",
                                        objectFit: isGeneratedImage
                                          ? "cover"
                                          : "contain",
                                      }}
                                      unoptimized={attachment.url.startsWith(
                                        "data:",
                                      )} // Only unoptimized for base64
                                    />
                                  </div>

                                  {/* Show generation info for generated images */}
                                  {isGeneratedImage &&
                                    generationMetadata?.prompt && (
                                      <div className="relative z-1 p-3">
                                        <div className="mb-1 text-xs break-words text-gray-600">
                                          <span className="font-medium">
                                            Prompt:
                                          </span>{" "}
                                          {generationMetadata?.prompt ??
                                            "No prompt available"}
                                        </div>
                                        <div className="mb-3 text-xs text-gray-500">
                                          {generationMetadata?.size ??
                                            "Unknown size"}{" "}
                                          •{" "}
                                          {generationMetadata?.quality ??
                                            "Unknown quality"}{" "}
                                          quality
                                        </div>

                                        {/* Action buttons for generated images */}
                                        <div className="flex justify-end gap-2">
                                          <button
                                            onClick={() =>
                                              copyImageToClipboard(
                                                attachment.url,
                                              )
                                            }
                                            className="cursor-pointer rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
                                            title="Copiar imagen"
                                          >
                                            <Copy size={14} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              shareImage(
                                                attachment.url,
                                                generationMetadata?.prompt,
                                              )
                                            }
                                            className="cursor-pointer rounded-lg bg-blue-100 p-2 text-blue-700 transition-colors hover:bg-blue-200"
                                            title="Compartir imagen"
                                          >
                                            <Share2 size={14} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              downloadImage(
                                                attachment.url,
                                                generationMetadata?.prompt,
                                              )
                                            }
                                            className="cursor-pointer rounded-lg bg-green-100 p-2 text-green-700 transition-colors hover:bg-green-200"
                                            title="Descargar imagen"
                                          >
                                            <Download size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                  {/* Show filename and actions for regular uploaded images */}
                                  {!isGeneratedImage && attachment.name && (
                                    <div className="relative z-1 bg-gray-50">
                                      <div className="border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
                                        {attachment.name}
                                      </div>

                                      {/* Action buttons for uploaded images */}
                                      <div className="flex justify-end gap-2 p-2">
                                        <button
                                          onClick={() =>
                                            copyImageToClipboard(attachment.url)
                                          }
                                          className="cursor-pointer rounded-lg bg-gray-100 p-1.5 text-gray-700 transition-colors hover:bg-gray-200"
                                          title="Copiar imagen"
                                        >
                                          <Copy size={12} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            shareImage(
                                              attachment.url,
                                              attachment.name,
                                            )
                                          }
                                          className="cursor-pointer rounded-lg bg-blue-100 p-1.5 text-blue-700 transition-colors hover:bg-blue-200"
                                          title="Compartir imagen"
                                        >
                                          <Share2 size={12} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            downloadImage(
                                              attachment.url,
                                              attachment.name,
                                            )
                                          }
                                          className="cursor-pointer rounded-lg bg-green-100 p-1.5 text-green-700 transition-colors hover:bg-green-200"
                                          title="Descargar imagen"
                                        >
                                          <Download size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              // Render non-image file attachments
                              // Only show content preview for CSV and Markdown, not PDFs
                              // Show content preview for text-based files (but not PDFs which can have weird content)
                              const showContentPreview = [
                                "csv",
                                "markdown",
                                "json",
                                "yaml",
                                "xml",
                                "txt",
                                "code",
                                "config",
                                "log",
                              ].includes(fileType);
                              const textContent = showContentPreview
                                ? extractTextContent(attachment.url)
                                : null;

                              return (
                                <div
                                  key={index}
                                  className="animate-in fade-in slide-in-from-bottom-2 relative z-1 max-w-sm overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-3 shadow-lg transition-all duration-300 hover:border-gray-300 hover:shadow-xl"
                                >
                                  {/* Header with icon and filename */}
                                  <div
                                    className={`flex items-center gap-2 ${showContentPreview && textContent ? "mb-2 border-b border-gray-100 pb-2" : ""}`}
                                  >
                                    {getFileIcon(attachment)}
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm font-medium text-gray-700">
                                        {attachment.name ?? `File ${index + 1}`}
                                      </div>
                                      <div className="text-xs text-gray-500 uppercase">
                                        {fileType}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Content preview - only for CSV and Markdown files */}
                                  {showContentPreview && textContent && (
                                    <div className="rounded border bg-gray-50 p-2 font-mono text-xs leading-relaxed text-gray-600">
                                      {textContent}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          },
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
          {/* Loading indicator when assistant is typing - only show before streaming starts */}
          <LoadingIndicator
            isLoading={isLoading && !hasActiveStreamingOrGeneration(messages)}
          />
        </div>
      </div>
    </div>
  );

  // Helper function to check if there's active streaming or generation
  function hasActiveStreamingOrGeneration(messages: Message[]): boolean {
    if (messages.length === 0) return false;

    const lastMessage = messages[messages.length - 1];

    // Check if there are active tool invocations (like image generation)
    if (lastMessage?.toolInvocations?.some((tool) => tool.state === "call")) {
      return true;
    }

    // If last message is from assistant, assume streaming has started
    // This includes empty messages that are about to receive content or tool invocations
    if (lastMessage?.role === "assistant") {
      return true;
    }

    return false;
  }
}
