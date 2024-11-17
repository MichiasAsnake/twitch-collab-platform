let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getTwitchAccessToken() {
  // Return cached token if it's still valid (with 5 minute buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300000) {
    return cachedToken.token;
  }

  const response = await fetch(
    'https://id.twitch.tv/oauth2/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: 'client_credentials'
      })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get Twitch access token');
  }

  const data = await response.json();
  
  // Cache the token with expiration
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };

  return data.access_token;
} 