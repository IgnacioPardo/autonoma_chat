import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      include: {
        messages: {
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
    const { title, messages } = await request.json()

    const chat = await prisma.chat.create({
      data: {
        title,
        messages: {
          create: messages.map((message: { role: string; content: string; position?: number }, index: number) => ({
            role: message.role,
            content: message.content,
            position: message.position ?? index
          }))
        }
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
    console.error('Error creating chat:', error)
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}
