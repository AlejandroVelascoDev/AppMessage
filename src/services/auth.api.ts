import { api } from '@/lib/api';
import { clearToken, setToken } from '@/lib/token';

export async function login(email: string, password: string) {
  const { token } = await api<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  await setToken(token);
  return token;
}

export async function register(
  email: string,
  username: string,
  password: string
) {
  const { token } = await api<{ token: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });

  await setToken(token);
  return token;
}

export async function logout() {
  await clearToken();
}
