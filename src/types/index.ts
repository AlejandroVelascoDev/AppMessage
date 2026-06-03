export type User = {
  id: number;
  username: string;
  email: string;
  profilePictureUrl?: string | null;
};

export type ChatParticipant = {
  id: number;
  username: string;
  profilePictureUrl?: string | null;
};

export type ChatMessage = {
  id: number;
  chatId: number;
  senderId: number;
  senderUsername: string;
  content: string;
  timestamp: string;
};

export type Chat = {
  id: number;
  name: string | null;
  type: 'SINGLE' | 'GROUP';
  participants: ChatParticipant[];
  lastMessage: ChatMessage | null;
  createdAt: string;
};

export type MessageHistoryResponse = {
  chatId: number;
  messages: ChatMessage[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalMessages: number;
  hasMore: boolean;
};
