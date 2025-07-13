// https://vercel.com/guides/streaming-from-llm

import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages, tool } from "ai";
import type { Message } from "ai";
import { z } from "zod";
import { generateImage } from "~/lib/image-generation";

// Allow streaming responses up to 60 seconds for image generation
export const maxDuration = 60;

export async function POST(req: Request) {
  // Check content length before processing
  const contentLength = req.headers.get("content-length");
  const MAX_PAYLOAD_SIZE = 25 * 1024 * 1024; // 25MB limit for Vercel Functions

  if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
    console.error("Payload too large:", contentLength);
    return new Response(
      JSON.stringify({
        error: "Payload too large. Please reduce the size of attachments.",
        maxSize: "25MB",
      }),
      {
        status: 413,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = (await req.json()) as { messages: Message[] };
    const { messages } = body;

    // Validate total attachment size
    let totalAttachmentSize = 0;
    for (const message of messages) {
      if (message.experimental_attachments) {
        for (const attachment of message.experimental_attachments) {
          // Estimate base64 size (base64 is ~33% larger than original)
          const base64Data = attachment.url.split(",")[1] ?? "";
          totalAttachmentSize += base64Data.length;
        }
      }
    }

    if (totalAttachmentSize > 20 * 1024 * 1024) {
      // 20MB for attachments
      console.error("Attachments too large:", totalAttachmentSize);
      return new Response(
        JSON.stringify({
          error:
            "Attachments too large. Please reduce file sizes or number of files.",
          currentSize: Math.round(totalAttachmentSize / 1024 / 1024) + "MB",
          maxSize: "20MB",
        }),
        {
          status: 413,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log("=== Chat API called ===");
    console.log(
      "Received messages:",
      messages.map((m: Message) => ({
        role: m.role,
        content:
          typeof m.content === "string"
            ? m.content.substring(0, 50) + "..."
            : "multipart content",
        hasAttachments: (m.experimental_attachments?.length ?? 0) > 0,
        hasToolInvocations: !!m.toolInvocations?.length,
        attachmentSizes:
          m.experimental_attachments?.map((a) =>
            Math.round((a.url.length * 0.75) / 1024),
          ) ?? [],
      })),
    );

    // Additional backend cleanup for safety (frontend should have already cleaned)
    const cleanMessages = messages.map((message, index) => {
      console.log(message);
      console.log(
        message.parts?.length == 2 &&
          message.parts?.[1]?.type === "tool-invocation"
          ? message.parts?.[1]?.toolInvocation
          : "No tool invocation found in parts",
      );
      /* {
        role: 'user',
        content: 'Draw a ferrari f40',
        parts: [ { type: 'text', text: 'Draw a ferrari f40' } ]
      }
      {
        role: 'assistant',
        content: '',
        parts: [
          { type: 'step-start' },
          { type: 'tool-invocation', toolInvocation: [Object] }
        ]
      }
      {
        role: 'user',
        content: 'Do you like ferraris?',
        parts: [ { type: 'text', text: 'Do you like ferraris?' } ]
      } */
      if (
        message.parts?.length &&
        message.parts.some((part) => part.type === "tool-invocation")
      ) {
        console.log(
          `Backend: Additional cleaning of toolInvocations from message ${index} (${message.role})`,
        );
        // Remove "parts" key from assistant messages
        const { parts: _parts, ...cleanMessage } = message;
        return cleanMessage;
      }
      return message;
    });

    console.log("Backend: Final clean messages count:", cleanMessages.length);

    const result = streamText({
      model: openai("gpt-4o"), // gpt-4o supports vision
      messages: convertToCoreMessages(cleanMessages),
      tools: {
        generateImage: tool({
          description:
            "Generate an image based on a text description using DALL-E 3",
          parameters: z.object({
            prompt: z
              .string()
              .describe("A detailed description of the image to generate"),
            size: z
              .enum(["1024x1024", "1024x1792", "1792x1024"])
              .default("1024x1024")
              .describe("The size of the image"),
            quality: z
              .enum(["standard", "hd"])
              .default("standard")
              .describe("The quality of the image"),
          }),
          execute: async ({ prompt, size, quality }) => {
            console.log("🎨 Starting image generation tool execution...");
            console.log("Parameters:", {
              prompt: prompt.substring(0, 100),
              size,
              quality,
            });

            try {
              console.log("📞 Calling generateImage function...");
              // Call image generation function directly
              const result = await generateImage({ prompt, size, quality });

              console.log("📊 Image generation result:", {
                success: result.success,
                hasUrl: !!result.imageUrl,
                hasError: !!result.error,
              });

              if (result.success && result.imageUrl) {
                console.log("✅ Image generation successful, returning result");
                return {
                  success: true,
                  imageUrl: result.imageUrl,
                  cloudinaryPublicId: result.cloudinaryPublicId,
                  prompt: result.prompt ?? prompt,
                  revisedPrompt: result.revisedPrompt,
                  size: size,
                  quality: quality,
                };
              } else {
                console.log("❌ Image generation failed:", result.error);
                return {
                  success: false,
                  error: result.error ?? "Unknown error",
                  prompt: prompt,
                };
              }
            } catch (error) {
              console.error("💥 Error in image generation tool:", error);
              return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                prompt: prompt,
              };
            }
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
