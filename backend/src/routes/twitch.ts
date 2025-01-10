import express from 'express';
import { socket } from '../lib/socket';  // Update path and import socket instead of io

const router = express.Router();

router.post('/twitch', async (req, res) => {
  const message = req.body;
  
  if (message.subscription.type === 'stream.online' || 
      message.subscription.type === 'stream.offline') {
    const userId = message.event.broadcaster_user_id;
    const isLive = message.subscription.type === 'stream.online';
    
    console.log('Received Twitch webhook:', { type: message.subscription.type, userId, isLive });

    // Broadcast via Socket.IO
    socket.emit('statusUpdate', { userId, isLive });
  }

  res.sendStatus(200);
});

export default router; 