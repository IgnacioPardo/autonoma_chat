import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: params.id },
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
    const { messages } = await request.json()

    // Delete existing messages and add new ones
    await prisma.message.deleteMany({
      where: { chatId: params.id }
    })

    const chat = await prisma.chat.update({
      where: { id: params.id },
      data: {
        messages: {
          create: messages.map((message: { role: string; content: string }) => ({
            role: message.role,
            content: message.content
          }))
        },
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
    const { title } = await request.json()

    const chat = await prisma.chat.update({
      where: { id: params.id },
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
    await prisma.chat.delete({
      where: { id: params.id }
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
