import type { Message } from 'ai'

export interface ChatHistory {
  id: string
  title?: string
  createdAt: string
  updatedAt: string
  messages: {
    id: string
    role: string
    content: string
    createdAt: string
  }[]
}

export async function generateChatTitle(messages: Message[]): Promise<string> {
  try {
    const response = await fetch('/api/chat/title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate title')
    }

    const { title } = await response.json()
    return title || generateFallbackTitle(messages)
  } catch (error) {
    console.error('Error generating AI title:', error)
    return generateFallbackTitle(messages)
  }
}

function generateFallbackTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(msg => msg.role === 'user')
  if (firstUserMessage) {
    // Take first 40 characters and add ellipsis if longer
    const title = firstUserMessage.content.slice(0, 40)
    return title.length < firstUserMessage.content.length ? `${title}...` : title
  }
  return `Chat ${new Date().toLocaleDateString()}`
}

export async function saveChatHistory(messages: Message[], title?: string): Promise<ChatHistory> {
  // Generate title using AI if not provided and we have enough messages
  let chatTitle = title
  if (!chatTitle && messages.length >= 2) {
    chatTitle = await generateChatTitle(messages)
  } else if (!chatTitle) {
    chatTitle = generateFallbackTitle(messages)
  }

  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: chatTitle,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to save chat history')
  }

  return response.json()
}

export async function updateChatHistory(chatId: string, messages: Message[]): Promise<ChatHistory> {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update chat history')
  }

  return response.json()
}

export async function getChatHistory(): Promise<ChatHistory[]> {
  const response = await fetch('/api/chats')
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat history')
  }

  return response.json()
}

export async function getChatById(id: string): Promise<ChatHistory> {
  const response = await fetch(`/api/chats/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat')
  }

  return response.json()
}

export async function deleteChatHistory(id: string): Promise<void> {
  const response = await fetch(`/api/chats/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete chat')
  }
}
