import { db } from './db.js';
import { Server } from 'socket.io';

export function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://stirring-longma-bc41fd.netlify.app']
        : ['http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    socket.on('message', async (message) => {
      try {
        const result = await db.query(
          'INSERT INTO messages (id, from_user_id, to_user_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
          [message.id, message.fromUserId, message.toUserId, message.content]
        );
        
        io.emit('message', result.rows[0]);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });
  });

  return io;
}

export { setupWebSocket };