import type { Message } from 'ai'

export interface ChatAttachment {
  id: string
  name: string
  contentType: string
  url: string
  size?: number
  createdAt: string
}

export interface ChatHistory {
  id: string
  title?: string
  createdAt: string
  updatedAt: string
  messages: {
    id: string
    role: string
    content: string
    position: number
    createdAt: string
    attachments: ChatAttachment[]
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

    const data = await response.json() as { title?: string }
    return data.title ?? generateFallbackTitle(messages)
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
  console.log('saveChatHistory called with messages:', messages);
  
  // Generate title using AI if not provided and we have enough messages
  let chatTitle = title
  if (!chatTitle && messages.length >= 2) {
    // console.log('Generating AI title...');
    chatTitle = await generateChatTitle(messages)
    // console.log('Generated AI title:', chatTitle);
  } 
  
  chatTitle ??= generateFallbackTitle(messages)

  const messagesToSave = messages.map((msg, index) => ({
    role: msg.role,
    content: msg.content,
    position: index,
    attachments: msg.experimental_attachments?.map(att => ({
      name: att.name ?? 'Unknown',
      contentType: att.contentType ?? 'application/octet-stream',
      url: att.url,
      size: att.url ? Math.round(att.url.length * 0.75) : undefined // Rough estimate of base64 size
    })) ?? []
  }));
  
  console.log('Messages to save with attachments:', messagesToSave.map(m => ({
    role: m.role,
    content: m.content.substring(0, 50) + '...',
    attachmentCount: m.attachments.length,
    attachmentDetails: m.attachments.map((att, i) => ({
      index: i,
      name: att.name,
      contentType: att.contentType,
      urlLength: att.url?.length ?? 0
    }))
  })));

  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: chatTitle,
      messages: messagesToSave
    }),
  })

  if (!response.ok) {
    console.error('Failed to save chat, response:', response.status, response.statusText);
    throw new Error('Failed to save chat history')
  }

  const result = await response.json() as ChatHistory;
  console.log('Saved chat result with attachments:', {
    id: result.id,
    title: result.title,
    messageCount: result.messages?.length
  });
  return result;
}

export async function updateChatHistory(chatId: string, messages: Message[]): Promise<ChatHistory> {
  console.log('updateChatHistory called for chat:', chatId, 'with messages:', messages.length);
  
  // Filter out empty messages and ensure content is valid
  const validMessages = messages.filter(msg => 
    msg?.content && 
    typeof msg.content === 'string' && 
    msg.content.trim().length > 0 &&
    msg.role &&
    (msg.role === 'user' || msg.role === 'assistant')
  );
  
  const messagesToSave = validMessages.map((msg, index) => ({
    role: msg.role,
    content: msg.content.trim(),
    position: index,
    attachments: msg.experimental_attachments?.map(att => ({
      name: att.name ?? 'Unknown',
      contentType: att.contentType ?? 'application/octet-stream',
      url: att.url,
      size: att.url ? Math.round(att.url.length * 0.75) : undefined
    })) ?? []
  }));
  
  console.log('Original messages count:', messages.length);
  console.log('Valid messages count:', validMessages.length);
  console.log('Messages to update with attachments:', messagesToSave.map(m => ({
    role: m.role,
    content: m.content.substring(0, 50) + '...',
    attachmentCount: m.attachments.length,
    attachmentDetails: m.attachments.map((att, i) => ({
      index: i,
      name: att.name,
      contentType: att.contentType,
      urlLength: att.url?.length ?? 0
    }))
  })));

  const response = await fetch(`/api/chats/${chatId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messagesToSave
    }),
  })

  if (!response.ok) {
    console.error('Failed to update chat, response:', response.status, response.statusText);
    throw new Error('Failed to update chat history')
  }

  const result = await response.json() as ChatHistory;
  // console.log('Updated chat result:', result);
  return result;
}

export async function getChatHistory(): Promise<ChatHistory[]> {
  const response = await fetch('/api/chats')
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat history')
  }

  return response.json() as Promise<ChatHistory[]>
}

export async function getChatById(id: string): Promise<ChatHistory> {
  const response = await fetch(`/api/chats/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat')
  }

  return response.json() as Promise<ChatHistory>
}

export async function deleteChatHistory(id: string): Promise<void> {
  const response = await fetch(`/api/chats/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete chat')
  }
}
