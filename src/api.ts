import { Message } from './types';
import { useStore } from './store';
import { getTwitchAuthUrl } from './lib/twitch';

export async function fetchMessages(requestId: string): Promise<Message[]> {
  const token = localStorage.getItem('twitch_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`/api/requests/${requestId}/messages`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 401) {
      localStorage.removeItem('twitch_token');
      localStorage.removeItem('twitch_user_id');
      window.location.href = getTwitchAuthUrl();
      return [];
    }
    throw new Error(error.error || 'Failed to fetch messages');
  }

  return response.json();
}

export async function sendMessage(message: Message): Promise<Message> {
  // Implement API call
  return message;
}

export async function fetchUserMessages(userId: string): Promise<Message[]> {
  // Implement API call
  return [];
}

export async function deleteRequest(requestId: string): Promise<void> {
  const token = localStorage.getItem('twitch_token');
  const userId = localStorage.getItem('twitch_user_id');

  if (!token || !userId) {
    throw new Error('Not authenticated');
  }

  console.log('Sending delete request with userId:', userId);

  const response = await fetch(`/api/requests/${requestId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId: userId.toString() })
  });

  if (!response.ok) {
    const error = await response.json();
    console.log('Delete request failed with:', error);
    throw new Error(error.error || 'Failed to delete request');
  }
} 