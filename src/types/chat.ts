export interface Attachment {
  name?: string;
  url: string;
  contentType: string;
  size?: number;
  fileType?: 'image' | 'csv' | 'markdown' | 'pdf' | 'json' | 'yaml' | 'xml' | 'txt' | 'code' | 'config' | 'log' | 'other';
}

export interface MessageWithAttachments {
  content: string;
  role: 'user' | 'assistant';
  experimental_attachments?: Attachment[];
}
