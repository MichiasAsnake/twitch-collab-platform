import fetch from 'node-fetch';

export async function getAppAccessToken() {
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  });
  const data = await response.json();
  return data.access_token;
}

export async function subscribeToStreamStatus(userId) {
  const token = await getAppAccessToken();
  const events = ['stream.online', 'stream.offline'];
  
  for (const type of events) {
    await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        version: '1',
        condition: { broadcaster_user_id: userId },
        transport: {
          method: 'webhook',
          callback: `${process.env.API_URL}/webhooks/twitch`,
          secret: process.env.TWITCH_WEBHOOK_SECRET
        }
      })
    });
  }
} 