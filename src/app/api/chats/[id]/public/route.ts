import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get chat with messages and attachments - only if shared
    const chat = await prisma.chat.findFirst({
      where: { 
        id,
        isShared: true // Only return chats that are explicitly shared
      },
      include: {
        messages: {
          orderBy: { position: "asc" },
          include: {
            attachments: true,
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found or not shared" },
        { status: 404 }
      );
    }

    // Return chat data in public format (no user info, read-only)
    return NextResponse.json({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt.toISOString(),
      messages: chat.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        position: message.position,
        createdAt: message.createdAt.toISOString(),
        attachments: message.attachments.map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          contentType: attachment.contentType,
          url: attachment.url,
          size: attachment.size,
        })),
      })),
      isPublic: true, // Flag to indicate this is a public view
    });
  } catch (error) {
    console.error("Error fetching public chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
