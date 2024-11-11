import { TwitchUser } from '../types';

const TWITCH_CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID?.trim();
const TWITCH_REDIRECT_URI = import.meta.env.VITE_TWITCH_REDIRECT_URI?.trim();

export function getTwitchAuthUrl() {
  if (!TWITCH_CLIENT_ID) {
    throw new Error('Twitch Client ID is not configured');
  }

  const scope = 'user:read:email channel:read:stream_key';
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_REDIRECT_URI,
    response_type: 'token',
    scope: scope,
  });

  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
}

export async function getTwitchUser(accessToken: string): Promise<TwitchUser> {
  if (!TWITCH_CLIENT_ID) {
    throw new Error('Twitch Client ID is not configured');
  }

  try {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Twitch API Error:', {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const userData = await response.json();
    const user = userData.data[0];

    const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });

    const streamData = await streamResponse.json();
    const stream = streamData.data[0];

    return {
      id: user.id,
      login: user.login,
      displayName: user.display_name,
      profileImageUrl: user.profile_image_url,
      isLive: !!stream,
      category: stream?.game_name ?? 'Just Chatting',
      title: stream?.title ?? '',
    };
  } catch (error) {
    console.error('Twitch API Error:', error);
    throw error;
  }
}