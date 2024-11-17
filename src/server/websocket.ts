import { Server } from 'socket.io';
import { ApiClient } from '@twurple/api';
import { ClientCredentialsAuthProvider } from '@twurple/auth';
import { EventSubHttpListener, ReverseProxyAdapter } from '@twurple/eventsub-http';
import { NgrokAdapter } from '@twurple/eventsub-ngrok';
import { getDb } from './db.js';

let io: Server;
let listener: EventSubHttpListener;
const subscribedUsers = new Set<string>();

// Create auth provider and API client setup...
const authProvider = new ClientCredentialsAuthProvider(
  process.env.TWITCH_CLIENT_ID!,
  process.env.TWITCH_CLIENT_SECRET!
);

const apiClient = new ApiClient({ authProvider });

export async function ensureUserSubscribed(userId: string) {
  if (subscribedUsers.has(userId)) {
    console.log(`Already subscribed to events for ${userId}`);
    return;
  }

  console.log(`Setting up EventSub subscriptions for ${userId}`);

  try {
    // Add debug logging for existing subscriptions
    const existingSubs = await apiClient.eventSub.getSubscriptions();
    console.log('Current EventSub subscriptions:', {
      total: existingSubs.data.length,
      forUser: existingSubs.data.filter(sub => sub.condition.broadcaster_user_id === userId).length
    });

    // Subscribe to online events
    const onlineSub = await listener.subscribeToStreamOnlineEvents(userId, async (event) => {
      console.log(`[EVENTSUB] Received ONLINE event for ${userId}`, event);
      
      const pool = await getDb();
      
      // Update database
      await pool.query(
        'UPDATE users SET is_live = true WHERE id = $1 RETURNING is_live',
        [userId]
      ).then(result => {
        console.log(`[DB] Updated ${userId} to online:`, result.rows[0]);
      });
      
      // Emit to all connected clients
      io.emit('statusUpdate', { userId, isLive: true });
    });

    // Subscribe to offline events
    const offlineSub = await listener.subscribeToStreamOfflineEvents(userId, async (event) => {
      console.log(`[EVENTSUB] Received OFFLINE event for ${userId}`, event);
      
      const pool = await getDb();
      
      // Update database
      await pool.query(
        'UPDATE users SET is_live = false WHERE id = $1 RETURNING is_live',
        [userId]
      ).then(result => {
        console.log(`[DB] Updated ${userId} to offline:`, result.rows[0]);
      });
      
      // Emit to all connected clients
      io.emit('statusUpdate', { userId, isLive: false });
    });

    subscribedUsers.add(userId);
    console.log(`Successfully subscribed to events for ${userId}`);

    // Verify new subscriptions
    const newSubs = await apiClient.eventSub.getSubscriptions();
    console.log('Updated EventSub subscriptions:', {
      total: newSubs.data.length,
      forUser: newSubs.data.filter(sub => sub.condition.broadcaster_user_id === userId).length
    });

    return { onlineSub, offlineSub };
  } catch (error) {
    console.error(`Failed to subscribe to events for ${userId}:`, error);
    throw error;
  }
}

export function setupWebSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  // Create and start EventSub listener
  listener = new EventSubHttpListener({
    apiClient,
    adapter: process.env.NODE_ENV === 'production'
      ? new ReverseProxyAdapter({
          hostName: process.env.HOST_NAME!,
          port: 3000
        })
      : new NgrokAdapter(),
    secret: process.env.TWITCH_WEBHOOK_SECRET!
  });

  listener.start();

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('checkStatus', async (userId) => {
      try {
        // Ensure we're subscribed to this user's events
        await ensureUserSubscribed(userId);

        // Check actual Twitch status
        const stream = await apiClient.streams.getStreamByUserId(userId);
        const isLive = Boolean(stream);
        
        console.log(`[STATUS CHECK] User ${userId}:`, {
          twitchResponse: stream ? {
            id: stream.id,
            startDate: stream.startDate,
            title: stream.title,
            isLive: true
          } : {
            isLive: false
          }
        });

        // Get current database state
        const pool = await getDb();
        const dbResult = await pool.query(
          'SELECT is_live FROM users WHERE id = $1',
          [userId]
        );
        
        console.log(`[DATABASE STATE] User ${userId}:`, {
          dbState: dbResult.rows[0]?.is_live
        });

        // Update database if it doesn't match Twitch
        if (dbResult.rows[0]?.is_live !== isLive) {
          console.log(`[UPDATING DB] User ${userId} from ${dbResult.rows[0]?.is_live} to ${isLive}`);
          await pool.query(
            'UPDATE users SET is_live = $1 WHERE id = $2',
            [isLive, userId]
          );
        }

        // Send response to client
        console.log(`[EMITTING STATUS] User ${userId}: ${isLive}`);
        socket.emit('statusResponse', { userId, isLive });

      } catch (error) {
        console.error(`[ERROR] Checking status for ${userId}:`, error);
        socket.emit('statusResponse', { userId, isLive: false });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
}

// Add a function to check EventSub subscription status
export async function checkSubscriptionStatus(userId: string) {
  try {
    const subs = await apiClient.eventSub.getSubscriptions();
    const userSubs = subs.data.filter(sub => 
      sub.condition.broadcasterUserId === userId
    );
    
    console.log(`EventSub subscriptions for ${userId}:`, userSubs);
    return userSubs;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return [];
  }
} 