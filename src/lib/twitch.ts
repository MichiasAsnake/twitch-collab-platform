import { TwitchUser } from '../types';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

const TWITCH_CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID?.trim();
const TWITCH_REDIRECT_URI = import.meta.env.VITE_TWITCH_REDIRECT_URI?.trim();

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

const socket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 60000,
  withCredentials: true,
  extraHeaders: {
    'Access-Control-Allow-Origin': '*'
  }
});

socket.on('connect', () => {
  console.log('Socket connected successfully');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export function getTwitchAuthUrl() {
  console.log('Environment variables:', {
    TWITCH_CLIENT_ID,
    TWITCH_REDIRECT_URI,
    raw: import.meta.env
  });

  if (!TWITCH_CLIENT_ID) {
    throw new Error('Twitch Client ID is not configured');
  }

  if (!TWITCH_REDIRECT_URI) {
    throw new Error('Twitch Redirect URI is not configured');
  }

  const scope = 'user:read:email channel:read:stream_key channel:read:editors';
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_REDIRECT_URI,
    response_type: 'token',
    scope: scope,
  });

  const url = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  console.log('Generated auth URL:', url);

  return url;
}

export async function getTwitchUser(accessToken: string): Promise<TwitchUser> {
  // First get user data
  const userResponse = await fetch('https://api.twitch.tv/helix/users', {
    credentials: 'include',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': import.meta.env.VITE_TWITCH_CLIENT_ID,
    },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch user data');
  }

  const userData = await userResponse.json();
  const user = userData.data[0];

  console.log('User data:', user);

  // Add this line to store the user ID
  localStorage.setItem('twitch_user_id', user.id);

  // Then get channel data
  const channelResponse = await fetch(
    `https://api.twitch.tv/helix/search/channels?query=${user.login}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': import.meta.env.VITE_TWITCH_CLIENT_ID,
    },
  });

  if (!channelResponse.ok) {
    console.error('Channel response error:', await channelResponse.text());
    throw new Error('Failed to fetch channel data');
  }

  const channelData = await channelResponse.json();
  const channelInfo = channelData.data.find(
    (channel: any) => channel.id === user.id
  );

  console.log('Channel data:', {
    channelInfo,
    isLive: channelInfo?.is_live
  });

  return {
    id: user.id,
    login: user.login,
    displayName: user.display_name,
    profileImageUrl: user.profile_image_url,
    isLive: channelInfo?.is_live ?? false,
    category: channelInfo?.game_name || null,
    title: channelInfo?.title || null,
  };
}

// Add this function to get app access token
export async function getAppAccessToken() {
  try {
    // Make sure these environment variables are properly set
    const clientId = import.meta.env.VITE_TWITCH_CLIENT_ID?.trim();
    const clientSecret = import.meta.env.VITE_TWITCH_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      console.error('Missing Twitch credentials:', { clientId: !!clientId, clientSecret: !!clientSecret });
      throw new Error('Twitch credentials not configured');
    }

    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get app token:', errorText);
      throw new Error('Failed to get app token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting app access token:', error);
    throw error;
  }
}

// Add this function to get app access token if user isn't logged in
export async function getAccessToken() {
  const store = useStore.getState();
  let token = store.auth.token;
  
  // If no user token, get app token
  if (!token) {
    token = await getAppAccessToken();
  }
  
  return token;
}

// Modify fetchCategories to use the new getAccessToken function
export async function fetchCategories(query: string) {
  try {
    const token = await getAccessToken();
    const clientId = import.meta.env.VITE_TWITCH_CLIENT_ID?.trim();

    if (!clientId) {
      throw new Error('Twitch Client ID not configured');
    }

    console.log('Fetching categories with token:', { tokenExists: !!token, clientId: !!clientId });

    const response = await fetch(
      `https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch categories:', errorText);
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in fetchCategories:', error);
    return [];
  }
}

export async function subscribeToStreamStatus(userId: string) {
  const token = await getAppAccessToken();
  
  // Subscribe to stream.online event
  await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': import.meta.env.VITE_TWITCH_CLIENT_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'stream.online',
      version: '1',
      condition: { broadcaster_user_id: userId },
      transport: {
        method: 'webhook',
        callback: `${import.meta.env.VITE_API_URL}/webhooks/twitch`,
        secret: import.meta.env.VITE_WEBHOOK_SECRET
      }
    })
  });

  // Subscribe to stream.offline event
  await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': import.meta.env.VITE_TWITCH_CLIENT_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'stream.offline',
      version: '1',
      condition: { broadcaster_user_id: userId },
      transport: {
        method: 'webhook',
        callback: `${import.meta.env.VITE_API_URL}/webhooks/twitch`,
        secret: import.meta.env.VITE_WEBHOOK_SECRET
      }
    })
  });
}

export function useStreamStatus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    socket.on('stream.status', (data) => {
      if (data.type === 'stream.online' || data.type === 'stream.offline') {
        const isLive = data.type === 'stream.online';
        const userId = data.broadcaster_user_id;
        
        console.log('Received stream status update:', { userId, isLive });

        queryClient.setQueryData(
          ['streamers-status'],
          (oldData: StreamerStatus[] = []) => {
            if (!oldData.some(status => status.userId === userId)) {
              return [...oldData, { userId, isLive }];
            }
            return oldData.map(status => 
              status.userId === userId ? { ...status, isLive } : status
            );
          }
        );

        socket.emit('statusUpdate', { userId, isLive });
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    return () => {
      socket.off('stream.status');
      socket.off('connect_error');
    };
  }, [queryClient]);
}