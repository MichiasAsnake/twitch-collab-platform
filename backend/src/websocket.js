export function setupWebSocket(io) {
  const users = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('join', (userId) => {
      users.set(userId, socket.id);
      console.log(`User ${userId} joined`);
    });

    socket.on('message', (message) => {
      const recipientSocket = users.get(message.toUserId);
      if (recipientSocket) {
        io.to(recipientSocket).emit('message', message);
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          users.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
}