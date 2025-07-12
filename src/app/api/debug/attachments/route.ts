import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
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

    const debugInfo = chats.map(chat => ({
      chatId: chat.id,
      title: chat.title,
      messageCount: chat.messages.length,
      messages: chat.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content.substring(0, 50) + '...',
        attachmentCount: msg.attachments.length,
        attachments: msg.attachments.map(att => ({
          id: att.id,
          name: att.name,
          contentType: att.contentType,
          size: att.size,
          urlLength: att.url.length,
          urlStart: att.url.substring(0, 50) + '...'
        }))
      }))
    }))

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    console.error('Error fetching debug info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    )
  }
}
