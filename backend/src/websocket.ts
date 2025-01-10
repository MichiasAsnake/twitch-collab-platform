import { ApiClient } from '@twurple/api';
import { EventSubHttpListener, DirectConnectionAdapter } from '@twurple/eventsub-http';
import { AppTokenAuthProvider } from '@twurple/auth';
import { Pool } from 'pg';
import { db } from './db';

interface StreamEvent {
  broadcasterId: string;
  broadcasterName: string;
  startedAt?: Date;
}

export async function setupWebSocket(pool: Pool) {
  const authProvider = new AppTokenAuthProvider(
    process.env.TWITCH_CLIENT_ID!,
    process.env.TWITCH_CLIENT_SECRET!
  );

  const apiClient = new ApiClient({ authProvider });
  
  const listener = new EventSubHttpListener({
    apiClient,
    secret: process.env.TWITCH_WEBHOOK_SECRET!,
    strictHostCheck: true,
    adapter: new DirectConnectionAdapter({
      hostName: process.env.HOST_NAME || 'localhost'
    })
  });

  // Use proper types for event subscription
  await listener.onStreamOnline(
    { userId: process.env.TWITCH_BROADCASTER_ID! },
    async (event: StreamEvent) => {
      try {
        // Handle stream online event
        const result = await db.query(
          'UPDATE users SET is_live = true WHERE twitch_id = $1',
          [event.broadcasterId]
        );
        console.log('Stream online event processed');
      } catch (error) {
        console.error('Error processing stream online event:', error);
      }
    }
  );

  await listener.onStreamOffline(
    { userId: process.env.TWITCH_BROADCASTER_ID! },
    async (event: StreamEvent) => {
      try {
        // Handle stream offline event
        const result = await db.query(
          'UPDATE users SET is_live = false WHERE twitch_id = $1',
          [event.broadcasterId]
        );
        console.log('Stream offline event processed');
      } catch (error) {
        console.error('Error processing stream offline event:', error);
      }
    }
  );

  await listener.start();
} 