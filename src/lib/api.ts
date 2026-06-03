import { getToken } from './token';

const API_URL = 'http://localhost:8080';

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

export { API_URL };
