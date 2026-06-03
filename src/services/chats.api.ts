import { api } from '@/lib/api';
import type { Chat } from '@/types';

export const createChat = (
  participantIds: number[],
  chatType: 'SINGLE' | 'GROUP' = 'SINGLE',
  chatName?: string
) =>
  api<Chat>('/api/chats', {
    method: 'POST',
    body: JSON.stringify({ participantIds, chatType, chatName }),
  });

export const getChats = () => api<Chat[]>('/api/chats');

export const getChat = (chatId: number) => api<Chat>(`/api/chats/${chatId}`);

export const markRead = (chatId: number) =>
  api<{ chatId: number; messagesMarkedAsRead: number }>(
    `/api/chats/${chatId}/read`,
    { method: 'PUT' }
  );

export const unreadCount = (chatId: number) =>
  api<{ chatId: number; unreadCount: number }>(
    `/api/chats/${chatId}/unread-count`
  );
