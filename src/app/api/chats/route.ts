import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'
import type { MessageWithAttachments } from '~/types/messages'
import { requireAuth } from '~/lib/auth-helpers'

export async function GET() {
  try {
    const user = await requireAuth()
    
    const chats = await prisma.chat.findMany({
      where: {
        userId: user.id
      },
      include: {
        messages: {
          include: {
            attachments: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(chats)
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json() as { title: string; messages: MessageWithAttachments[] }
    const { title, messages } = body

    // console.log('Creating chat with title:', title);
    // console.log('Messages with attachments:', messages.map((m: MessageWithAttachments, i: number) => ({
    //   index: i,
    //   role: m.role,
    //   content: m.content.substring(0, 50) + '...',
    //   attachmentCount: m.attachments?.length ?? 0
    // })));

    const chat = await prisma.chat.create({
      data: {
        title,
        userId: user.id,
        messages: {
          create: messages.map((message: { 
            role: string; 
            content: string; 
            position?: number;
            attachments?: { name: string; contentType: string; url: string; size?: number }[]
          }, index: number) => ({
            role: message.role,
            content: message.content,
            position: message.position ?? index,
            attachments: message.attachments ? {
              create: message.attachments.map(att => ({
                name: att.name,
                contentType: att.contentType,
                url: att.url,
                size: att.size
              }))
            } : undefined
          }))
        }
      },
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

    console.log('Created chat with ID:', chat.id);
    
    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}
