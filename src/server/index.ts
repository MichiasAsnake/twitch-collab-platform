import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { setupWebSocket, ensureUserSubscribed } from './websocket';
import userRoutes from './api/users';
import { Server } from 'socket.io';
import webhookRoutes from './routes/webhooks';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Make io available globally
declare global {
  var io: Server;
}
global.io = io;

// Setup middleware
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/webhooks', webhookRoutes);

// Setup WebSocket with EventSub
setupWebSocket(server);

// Your existing routes...

// When a user authenticates, subscribe to their stream status
app.post('/api/auth/twitch/callback', async (req, res) => {
  try {
    // ... your existing auth code ...

    // After saving user to database, subscribe to their stream status
    await ensureUserSubscribed(twitchUserId);

    res.json({ /* your response */ });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// When new users are added, subscribe to their events
app.post('/api/users', async (req, res) => {
  try {
    // ... your existing user creation code ...
    
    // Subscribe to their stream events
    await ensureUserSubscribed(userId);
    
    res.json({ /* your response */ });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Use server.listen instead of app.listen
server.listen(3000, () => {
  console.log('Server running on port 3000');
}); 