import { api } from '@/lib/api';
import type { ChatMessage, MessageHistoryResponse } from '@/types';

export const getMessages = (chatId: number, page = 0) =>
  api<MessageHistoryResponse>(
    `/api/chats/${chatId}/messages?page=${page}&size=50`
  );

export const sendMessageHttp = (chatId: number, content: string) =>
  api<ChatMessage>(`/api/chats/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ chatId, content }),
  });
