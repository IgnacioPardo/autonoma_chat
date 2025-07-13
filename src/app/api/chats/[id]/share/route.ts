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
    console.log("Session:", session?.user?.email);
    
    if (!session?.user?.email) {
      console.log("No session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { isShared } = await request.json() as { isShared: boolean };
    
    console.log("Chat ID:", id, "isShared:", isShared);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    console.log("User found:", user?.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user owns the chat first
    const chatExists = await prisma.chat.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    console.log("Chat exists:", !!chatExists);

    if (!chatExists) {
      return NextResponse.json({ error: "Chat not found or not owned by user" }, { status: 404 });
    }

    console.log("Updating chat sharing status...");

    // Update isShared using raw query
    await prisma.$executeRaw`UPDATE "chats" SET "isShared" = ${Boolean(isShared)} WHERE "id" = ${id} AND "userId" = ${user.id}`;

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
