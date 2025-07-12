export interface Attachment {
  name: string;
  url: string;
  contentType: string;
  size?: number;
  fileType?: 'image' | 'csv' | 'markdown' | 'pdf' | 'other';
}

export interface MessageWithAttachments {
  content: string;
  role: 'user' | 'assistant';
  experimental_attachments?: Attachment[];
}
