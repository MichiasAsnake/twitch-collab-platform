import express from 'express';
import WebSocket from 'ws';
import { io } from '../socket';  // You'll need to export io from your socket setup

const router = express.Router();

router.post('/twitch', async (req, res) => {
  const message = req.body;
  
  if (message.subscription.type === 'stream.online' || 
      message.subscription.type === 'stream.offline') {
    const userId = message.event.broadcaster_user_id;
    const isLive = message.subscription.type === 'stream.online';
    
    console.log('Received Twitch webhook:', { type: message.subscription.type, userId, isLive });

    // Broadcast via Socket.IO
    io.emit('statusUpdate', { userId, isLive });
  }

  res.sendStatus(200);
});

export default router; 