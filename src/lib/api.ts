import { socket } from './socket';
import { CollabRequest, Message, TwitchUser } from '../types';
import { useStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('twitch_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export async function fetchRequests(): Promise<CollabRequest[]> {
  return fetchWithAuth(`${API_URL}/api/requests`);
}

export async function createRequest(data: {
  title: string;
  description: string;
  category: string;
}): Promise<CollabRequest> {
  const user = useStore.getState().user;
  if (!user) throw new Error('Not authenticated');

  return fetchWithAuth(`${API_URL}/api/requests`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      userId: user.id,
      user: user, // Include full user object for immediate display
    }),
  });
}

export async function fetchMessages(requestId: string): Promise<Message[]> {
  return fetchWithAuth(`${API_URL}/api/messages/${requestId}`);
}

export async function sendMessage(data: {
  content: string;
  requestId: string;
  toUserId: string;
}): Promise<Message> {
  const user = useStore.getState().user;
  if (!user) throw new Error('Not authenticated');

  const message = await fetchWithAuth(`${API_URL}/api/messages`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      fromUserId: user.id,
      fromUser: user, // Include full user object for immediate display
    }),
  });

  // Emit message through WebSocket
  socket.emit('message', message);

  return message;
}

export async function fetchUserMessages(userId: string): Promise<Message[]> {
  return fetchWithAuth(`${API_URL}/api/users/${userId}/messages`);
}