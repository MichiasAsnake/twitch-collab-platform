import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db.js';

const router = express.Router();

// Get user profile
router.get('/users/:userId', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.userId]);
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages
router.get('/messages/:userId', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM messages WHERE from_user_id = $1 OR to_user_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create message
router.post('/messages', async (req, res) => {
  try {
    const { fromUserId, toUserId, content } = req.body;
    const result = await db.query(
      'INSERT INTO messages (id, from_user_id, to_user_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), fromUserId, toUserId, content]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

