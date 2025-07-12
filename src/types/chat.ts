export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

export interface MessageWithAttachments {
  content: string;
  role: 'user' | 'assistant';
  experimental_attachments?: Attachment[];
}
