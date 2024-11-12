import { TwitchUser } from '../types';

const TWITCH_CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID?.trim();
const TWITCH_REDIRECT_URI = import.meta.env.VITE_TWITCH_REDIRECT_URI?.trim();

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
  const channelResponse = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${user.id}`, {
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
  console.log('Channel data:', channelData);

  // Get stream status
  const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': import.meta.env.VITE_TWITCH_CLIENT_ID,
    },
  });

  if (!streamResponse.ok) {
    throw new Error('Failed to fetch stream data');
  }

  const streamData = await streamResponse.json();
  const isLive = streamData.data.length > 0;

  return {
    id: user.id,
    login: user.login,
    displayName: user.display_name,
    profileImageUrl: user.profile_image_url,
    isLive: isLive,
    category: channelData.data[0].game_name || null,
    title: channelData.data[0].title || null,
  };
}