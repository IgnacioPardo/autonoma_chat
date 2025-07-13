// https://vercel.com/guides/streaming-from-llm

import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages, tool } from "ai";
import type { Message } from "ai";
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Check content length before processing
  const contentLength = req.headers.get('content-length');
  const MAX_PAYLOAD_SIZE = 25 * 1024 * 1024; // 25MB limit for Vercel Functions
  
  if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
    console.error('Payload too large:', contentLength);
    return new Response(
      JSON.stringify({ 
        error: 'Payload too large. Please reduce the size of attachments.',
        maxSize: '25MB'
      }), 
      { 
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const body = await req.json() as { messages: Message[] };
    const { messages } = body;

    // Validate total attachment size
    let totalAttachmentSize = 0;
    for (const message of messages) {
      if (message.experimental_attachments) {
        for (const attachment of message.experimental_attachments) {
          // Estimate base64 size (base64 is ~33% larger than original)
          const base64Data = attachment.url.split(',')[1] ?? '';
          totalAttachmentSize += base64Data.length;
        }
      }
    }

    if (totalAttachmentSize > 20 * 1024 * 1024) { // 20MB for attachments
      console.error('Attachments too large:', totalAttachmentSize);
      return new Response(
        JSON.stringify({ 
          error: 'Attachments too large. Please reduce file sizes or number of files.',
          currentSize: Math.round(totalAttachmentSize / 1024 / 1024) + 'MB',
          maxSize: '20MB'
        }), 
        { 
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('=== Chat API called ===');
    console.log('Received messages:', messages.map((m: Message) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content.substring(0, 50) + '...' : 'multipart content',
      hasAttachments: (m.experimental_attachments?.length ?? 0) > 0,
      attachmentSizes: m.experimental_attachments?.map(a => Math.round((a.url.length * 0.75) / 1024)) ?? []
    })));

    const result = streamText({
      model: openai("gpt-4o"), // gpt-4o supports vision
      messages: convertToCoreMessages(messages),
      tools: {
        generateImage: tool({
          description: 'Generate an image based on a text description using DALL-E 3',
          parameters: z.object({
            prompt: z.string().describe('A detailed description of the image to generate'),
            size: z.enum(['1024x1024', '1024x1792', '1792x1024']).default('1024x1024').describe('The size of the image'),
            quality: z.enum(['standard', 'hd']).default('standard').describe('The quality of the image')
          }),
          execute: async ({ prompt, size, quality }) => {
            try {
              // Call our image generation API
              const response = await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/generate-image`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, size, quality }),
              });

              if (!response.ok) {
                throw new Error(`Image generation failed: ${response.statusText}`);
              }

              const data = await response.json() as { 
                success?: boolean;
                imageUrl?: string; 
                error?: string;
              };
              
              return {
                success: true,
                imageUrl: data.imageUrl,
                prompt: prompt,
                size: size,
                quality: quality
              };
            } catch (error) {
              console.error('Error generating image:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                prompt: prompt
              };
            }
          }
        })
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error processing chat request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
