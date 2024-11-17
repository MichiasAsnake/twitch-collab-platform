import { useStore } from '../store';
import { CollabRequest, User } from '../types';
import { getTwitchAuthUrl } from './twitch';

export const API_URL = import.meta.env.VITE_API_URL;


interface CreateRequestPayload {
  title: string;
  description: string;
  category: string;
}

export const sendMessage = async ({
  content,
  toUserId,
  requestId,
  fromUserId,
  fromUser
}: {
  content: string;
  toUserId: string;
  requestId: string;
  fromUserId: string;
  fromUser: User;
}) => {
  const response = await fetch(`${API_URL}/api/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('twitch_token')}`
    },
    body: JSON.stringify({
      content,
      toUserId,
      requestId,
      fromUserId,
      fromUser
    })
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};

export async function fetchMessages(requestId: string) {
  const response = await fetch(`${API_URL}/api/messages/${requestId}`, {
    credentials: 'include',
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
    credentials: 'include',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('twitch_token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user messages');
  }

  return response.json();
}

export async function createRequest(payload: CreateRequestPayload): Promise<CollabRequest> {
  const token = localStorage.getItem('twitch_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/requests`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 401) {
      localStorage.removeItem('twitch_token');
      localStorage.removeItem('twitch_user_id');
      window.location.href = getTwitchAuthUrl();
      return;
    }
    throw new Error(error.error || 'Failed to create request');
  }

  return response.json();
}

export const fetchRequests = async () => {
  const response = await fetch(`${API_URL}/api/requests`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch requests');
  }
  return response.json();
};

export const deleteRequest = async (requestId: string) => {
  const response = await fetch(`${API_URL}/api/requests/${requestId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to delete request');
  }
  return requestId;
};

export const fetchCategories = async () => {
  const response = await fetch(`${API_URL}/api/categories`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};