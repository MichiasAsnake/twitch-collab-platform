import { getDb } from './db.js';

let wsInstance = null;

export function setupWebSocket(io) {
  io.path('/socket.io');

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('join', async (userId) => {
      // Join a room named after the user's ID
      socket.join(userId);
      console.log(`User ${userId} joined`);
    });

    socket.on('checkStatus', async (userId) => {
      console.log('Checking status for user:', userId);
      try {
        const pool = await getDb();
        const result = await pool.query('SELECT is_live FROM users WHERE id = $1', [userId]);
        const isLive = result.rows[0]?.is_live || false;
        
        console.log(`Sending status response for ${userId}:`, isLive);
        socket.emit('statusResponse', { userId, isLive });
      } catch (error) {
        console.error('Error checking status:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  const wsHandler = {
    handleStreamEvent: async (event) => {
      const userId = event.broadcaster_user_id;
      const isLive = event.type === 'stream.online';
      
      try {
        const pool = await getDb();
        // Update user's live status
        await pool.query('UPDATE users SET is_live = $1 WHERE id = $2', [isLive, userId]);
        
        // Fetch updated user data with their requests
        const result = await pool.query(`
          SELECT 
            json_build_object(
              'id', u.id,
              'login', u.login,
              'displayName', u.display_name,
              'profileImageUrl', u.profile_image_url,
              'isLive', u.is_live
            ) as user
          FROM users u
          WHERE u.id = $1
        `, [userId]);

        // Broadcast the complete user data
        io.emit('statusUpdate', { 
          userId, 
          isLive,
          user: result.rows[0].user
        });
      } catch (error) {
        console.error('Error in handleStreamEvent:', error);
      }
    },

    broadcastMessage: async (message) => {
      // Broadcast to both users' rooms
      io.to(message.fromUser.id).to(message.toUser.id).emit('new_message', message);
    }
  };

  wsInstance = wsHandler;
  return wsHandler;
}

export function getWebSocket() {
  if (!wsInstance) {
    throw new Error('WebSocket not initialized');
  }
  return wsInstance;
}