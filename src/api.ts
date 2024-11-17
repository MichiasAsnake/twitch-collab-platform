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

export async function subscribeToStreamEvents(userId: string): Promise<EventSource> {
  // Create a new EventSource connection
  const eventSource = new EventSource(`/api/twitch/events/${userId}`);
  
  // Handle connection errors
  eventSource.onerror = (error) => {
    console.error('EventSource failed:', error);
    eventSource.close();
  };

  return eventSource;
}

export async function fetchChannelStatus(channelIds: string | string[]) {
  const ids = Array.isArray(channelIds) ? channelIds : [channelIds];
  const validIds = ids.filter(Boolean);
  if (!validIds.length) return [];
  
  const response = await fetch(`/api/streamers/status?ids=${validIds.join(',')}`);
  return response.json();
}

export async function fetchChannelsStatus(userIds: string[]): Promise<Array<{ userId: string; isLive: boolean }>> {
  const token = localStorage.getItem('twitch_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/users/status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userIds })
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 401) {
      localStorage.removeItem('twitch_token');
      localStorage.removeItem('twitch_user_id');
      window.location.href = getTwitchAuthUrl();
      return [];
    }
    throw new Error(error.error || 'Failed to fetch channels status');
  }

  return response.json();
}

export async function updateUserLiveStatus(userId: string, isLive: boolean) {
  const response = await fetch(`/api/users/${userId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isLive }),
  });
  return response.json();
} 