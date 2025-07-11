// https://vercel.com/guides/streaming-from-llm

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { type CoreMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: CoreMessage[] };

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
  });

  return result.toDataStreamResponse();
}
