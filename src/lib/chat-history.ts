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

export async function saveChatHistory(messages: Message[], title?: string): Promise<ChatHistory> {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title || generateChatTitle(messages),
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

function generateChatTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(msg => msg.role === 'user')
  if (firstUserMessage) {
    // Take first 50 characters and add ellipsis if longer
    const title = firstUserMessage.content.slice(0, 50)
    return title.length < firstUserMessage.content.length ? `${title}...` : title
  }
  return `Chat ${new Date().toLocaleDateString()}`
}
