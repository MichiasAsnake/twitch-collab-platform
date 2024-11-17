import { NextApiRequest, NextApiResponse } from 'next';
import { getTwitchAccessToken } from '../../../lib/twitch-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Invalid userIds provided' });
    }

    // Get app access token for Twitch API
    const accessToken = await getTwitchAccessToken();

    // First, get user information to ensure we have valid user IDs
    const usersResponse = await fetch(
      `https://api.twitch.tv/helix/users?${userIds
        .map(id => `id=${id}`)
        .join('&')}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!
        }
      }
    );

    if (!usersResponse.ok) {
      throw new Error('Failed to fetch users from Twitch API');
    }

    const usersData = await usersResponse.json();

    // Then fetch streams data
    const streamsResponse = await fetch(
      `https://api.twitch.tv/helix/streams?${userIds
        .map(id => `user_id=${id}`)
        .join('&')}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!
        }
      }
    );

    if (!streamsResponse.ok) {
      throw new Error('Failed to fetch streams from Twitch API');
    }

    const streamsData = await streamsResponse.json();
    
    // Transform the response to match our needs
    const statusMap = userIds.map(userId => ({
      userId,
      isLive: streamsData.data.some((stream: any) => stream.user_id === userId)
    }));

    return res.status(200).json(statusMap);
  } catch (error) {
    console.error('Error fetching stream status:', error);
    return res.status(500).json({ error: 'Failed to fetch stream status' });
  }
} 