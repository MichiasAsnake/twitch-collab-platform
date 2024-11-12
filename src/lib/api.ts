import { useStore } from '../store';
import { CollabRequest } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

interface SendMessageData {
  content: string;
  toUserId: string;
  requestId: string;
}

export async function sendMessage(data: SendMessageData) {
  const user = useStore.getState().user;
  if (!user) throw new Error('Not authenticated');
  if (!data.toUserId) throw new Error('toUserId is required');

  try {
    console.log('Sending message with data:', {
      ...data,
      fromUserId: user.id,
      fromUser: user
    });

    const response = await fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('twitch_token')}`
      },
      body: JSON.stringify({
        ...data,
        fromUserId: user.id,
        fromUser: user
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function fetchMessages(requestId: string) {
  const response = await fetch(`${API_URL}/api/messages/${requestId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('twitch_token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  return response.json();
}

export async function fetchUserMessages(userId: string) {
  const response = await fetch(`${API_URL}/api/users/${userId}/messages`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('twitch_token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user messages');
  }

  return response.json();
}

export const createRequest = async (requestData: CollabRequest) => {
  const user = useStore.getState().user;
  if (!user) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('twitch_token')}`
    },
    body: JSON.stringify({
      ...requestData,
      userId: user.id,
      user: user
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create request');
  }
  
  return response.json();
};

export const fetchRequests = async () => {
  const response = await fetch(`${API_URL}/api/requests`);
  if (!response.ok) {
    throw new Error('Failed to fetch requests');
  }
  return response.json();
};

export const deleteRequest = async (requestId: string) => {
  const response = await fetch(`/api/requests/${requestId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete request');
  }
  return requestId;
};