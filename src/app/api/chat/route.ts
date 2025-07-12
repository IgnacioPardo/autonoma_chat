// https://vercel.com/guides/streaming-from-llm

import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages } from "ai";
import type { Message } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json() as { messages: Message[] };
  const { messages } = body;

  console.log('=== Chat API called ===');
  console.log('Received messages:', messages.map((m: Message) => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content.substring(0, 50) + '...' : 'multipart content',
    hasAttachments: (m.experimental_attachments?.length ?? 0) > 0
  })));

  const result = streamText({
    model: openai("gpt-4o"), // gpt-4o supports vision
    messages: convertToCoreMessages(messages),
  });

  return result.toDataStreamResponse();
}
