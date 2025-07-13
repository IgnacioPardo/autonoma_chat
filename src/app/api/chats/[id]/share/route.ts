import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~/auth";
import { prisma } from "~/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("Share endpoint called");
    
    const session = await getServerSession(authOptions);
    console.log("Session:", session?.user);
    
    if (!session?.user) {
      console.log("No session or user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { isShared } = await request.json() as { isShared: boolean };
    
    console.log("Chat ID:", id, "isShared:", isShared);

    // Get user ID from session or find by email
    let userId: string;
    
    if ('id' in session.user && typeof session.user.id === 'string') {
      userId = session.user.id;
      console.log("Using session user ID:", userId);
    } else if (session.user.email) {
      console.log("Finding user by email:", session.user.email);
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      userId = user.id;
      console.log("Found user ID:", userId);
    } else {
      return NextResponse.json({ error: "No user identification available" }, { status: 401 });
    }

    // Check if user owns the chat first
    const chatExists = await prisma.chat.findFirst({
      where: {
        id,
        userId: userId,
      },
    });

    console.log("Chat exists:", !!chatExists);

    if (!chatExists) {
      return NextResponse.json({ error: "Chat not found or not owned by user" }, { status: 404 });
    }

    console.log("Updating chat sharing status...");

    // Update isShared using raw query
    await prisma.$executeRaw`UPDATE "chats" SET "isShared" = ${Boolean(isShared)} WHERE "id" = ${id} AND "userId" = ${userId}`;

    console.log("Raw SQL executed successfully");

    return NextResponse.json({
      id: chatExists.id,
      isShared: Boolean(isShared),
    });
  } catch (error) {
    console.error("Error updating chat share status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
