import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { Message } from "ai";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { messages: Message[] };
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 },
      );
    }

    // Take the first few messages to generate a title
    const firstMessages = messages.slice(0, 4).map((msg: Message) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content.slice(0, 200) : "", // Limit content length
    }));

    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      messages: [
        {
          role: "system",
          content: `Genera un título corto y descriptivo (máximo 6 palabras) para esta conversación en español. 
          El título debe capturar el tema principal de la conversación. 
          No uses comillas ni puntos. Solo responde con el título.`,
        },
        ...firstMessages,
      ],
      maxTokens: 20,
      temperature: 0.3,
    });

    const title = text.trim().replace(/["""]/g, "").slice(0, 50);

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 },
    );
  }
}
