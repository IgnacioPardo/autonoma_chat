import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if chat is shared using raw SQL
    const result = await prisma.$queryRaw<Array<{ isShared: boolean }>>`
      SELECT "isShared" FROM "chats" WHERE "id" = ${id}
    `;

    console.log("Share check result:", result);
    
    if (!result.length || !result[0]?.isShared) {
      return NextResponse.json(
        { error: "Chat not found or not shared" },
        { status: 404 }
      );
    }

    // Get chat with messages and attachments
    const chat = await prisma.chat.findUnique({
      where: { id },
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
        { error: "Chat not found" },
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
