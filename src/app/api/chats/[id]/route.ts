import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        messages: {
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const { messages } = await request.json()

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
    const validMessages = messages.filter((message: any) => 
      message && 
      message.content && 
      typeof message.content === 'string' && 
      message.content.trim().length > 0 &&
      message.role &&
      (message.role === 'user' || message.role === 'assistant')
    );

    // console.log('PUT endpoint - Valid messages count:', validMessages.length);
    // console.log('PUT endpoint - Valid messages details:', validMessages.map((m: any, i: number) => ({ 
    //   index: i,
    //   role: m.role, 
    //   content: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : ''),
    //   originalLength: m.content.length
    // })));

    if (validMessages.length === 0) {
      // console.log('PUT endpoint - No valid messages to save!');
      return NextResponse.json(
        { error: 'No valid messages provided' },
        { status: 400 }
      );
    }

    // Delete existing messages and add new ones
    await prisma.message.deleteMany({
      where: { chatId: id }
    })

    // console.log('PUT endpoint - Deleted existing messages for chat:', id);

    const messagesToCreate = validMessages.map((message: { role: string; content: string; position?: number }, index: number) => ({
      role: message.role,
      content: message.content.trim(),
      position: message.position ?? index
    }));

    // console.log('PUT endpoint - Messages to create in DB:', messagesToCreate.map((m, i) => ({
    //   dbIndex: i,
    //   role: m.role,
    //   content: m.content.substring(0, 30) + '...',
    //   position: m.position
    // })));

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
          orderBy: {
            position: 'asc'
          }
        }
      }
    })

    // console.log('PUT endpoint - Updated chat with new messages:', {
    //   chatId: chat.id,
    //   messageCount: chat.messages.length,
    //   messages: chat.messages.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' }))
    // });

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const { title } = await request.json()

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
  { params }: { params: { id: string } }
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
