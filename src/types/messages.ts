export interface MessageWithAttachments {
  role: string;
  content: string;
  position?: number;
  attachments?: {
    name: string;
    contentType: string;
    url: string;
    size?: number;
  }[];
}
