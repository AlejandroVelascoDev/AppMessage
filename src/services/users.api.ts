import { api } from '@/lib/api';
import type { User } from '@/types';

export const getMe = () => api<User>('/api/users/me');

export const getUserById = (id: number) => api<User>(`/api/users/${id}`);

export const searchUsers = (username: string) =>
  api<User[]>(`/api/users/search?username=${encodeURIComponent(username)}`);

export const updateMe = (data: { username: string }) =>
  api<User>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteMe = () => api('/api/users/me', { method: 'DELETE' });
