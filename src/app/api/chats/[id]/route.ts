import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'
import type { MessageWithAttachments } from '~/types/messages'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        messages: {
          include: {
            attachments: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error fetching chat:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json() as { messages: MessageWithAttachments[] }
    const { messages } = body

    // console.log('PUT endpoint - Chat ID:', id);
    // console.log('PUT endpoint - Received messages:', messages);
    // console.log('PUT endpoint - Number of messages:', messages?.length);
    // console.log('PUT endpoint - Raw messages details:', messages?.map((m: any, i: number) => ({
    //   index: i,
    //   role: m?.role,
    //   content: m?.content?.substring(0, 30) + '...',
    //   hasContent: !!m?.content,
    //   contentLength: m?.content?.length
    // })));

    // Filter out empty or invalid messages
    const validMessages = messages.filter((message: MessageWithAttachments): message is MessageWithAttachments => 
      Boolean(message) &&
      Boolean(message.content) &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0 &&
      Boolean(message.role) &&
      (message.role === 'user' || message.role === 'assistant')
    );

    if (validMessages.length === 0) {
      return NextResponse.json(
        { error: 'No valid messages provided' },
        { status: 400 }
      );
    }

    // Delete existing messages and their attachments (cascade will handle attachments)
    await prisma.message.deleteMany({
      where: { chatId: id }
    })

    console.log('PUT endpoint - Deleted existing messages for chat:', id);

    const messagesToCreate = validMessages.map((message: MessageWithAttachments, index: number) => ({
      role: message.role,
      content: message.content.trim(),
      position: message.position ?? index,
      attachments: message.attachments ? {
        create: message.attachments.map(att => ({
          name: att.name,
          contentType: att.contentType,
          url: att.url,
          size: att.size
        }))
      } : undefined
    }));

    console.log('PUT endpoint - Messages to create in DB:', messagesToCreate.map((m, i: number) => ({
      dbIndex: i,
      role: m.role,
      content: m.content.substring(0, 30) + '...',
      position: m.position,
      hasAttachments: Boolean(m.attachments)
    })));

    const chat = await prisma.chat.update({
      where: { id },
      data: {
        messages: {
          create: messagesToCreate
        },
        updatedAt: new Date()
      },
      include: {
        messages: {
          include: {
            attachments: true
          },
          orderBy: {
            createdAt: 'asc' // Use createdAt instead of position for now
          }
        }
      }
    })

    console.log('PUT endpoint - Updated chat successfully with messages');

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error updating chat:', error)
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json() as { title: string }
    const { title } = body

    const chat = await prisma.chat.update({
      where: { id },
      data: {
        title,
        updatedAt: new Date()
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error updating chat title:', error)
    return NextResponse.json(
      { error: 'Failed to update chat title' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.chat.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    )
  }
}
