import { API_URL } from '@/lib/api';
import { getToken } from '@/lib/token';

let socket: WebSocket | null = null;

export async function connectChatWS(
  chatId: number,
  onMessage: (msg: any) => void
) {
  const token = await getToken();
  if (!token) throw new Error('No token');

  socket = new WebSocket(
    `${API_URL.replace('http', 'ws')}/ws/chat/${chatId}?token=${token}`
  );

  socket.onmessage = (e) => onMessage(JSON.parse(e.data));
}

export function sendWSMessage(payload: any) {
  socket?.send(JSON.stringify(payload));
}

export function disconnectWS() {
  socket?.close();
}
