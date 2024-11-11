import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db.js';

export const router = Router();

// Middleware to parse Twitch token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  req.token = token;
  next();
};

router.options('*', (req, res) => {
  res.sendStatus(200);
});

// Get all requests
router.get('/requests', async (req, res) => {
  try {
    const db = await getDb();
    const requests = await db.all(`
      SELECT r.*, 
             json_object(
               'id', u.id,
               'login', u.login,
               'displayName', u.display_name,
               'profileImageUrl', u.profile_image_url,
               'isLive', u.is_live,
               'category', u.category,
               'title', u.title
             ) as user
      FROM requests r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    
    requests.forEach(r => r.user = JSON.parse(r.user));
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new request
router.post('/requests', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, userId, user } = req.body;
    const db = await getDb();

    // First ensure user exists in database
    await db.run(`
      INSERT OR REPLACE INTO users (
        id, login, display_name, profile_image_url, is_live, category, title
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id,
      user.login,
      user.displayName,
      user.profileImageUrl,
      user.isLive ? 1 : 0,
      user.category,
      user.title
    ]);

    // Then create the request
    const requestId = uuidv4();
    await db.run(`
      INSERT INTO requests (id, user_id, title, description, category)
      VALUES (?, ?, ?, ?, ?)
    `, [requestId, userId, title, description, category]);

    const newRequest = {
      id: requestId,
      userId,
      title,
      description,
      category,
      createdAt: new Date().toISOString(),
      user
    };

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a request
router.get('/messages/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const db = await getDb();
    
    const messages = await db.all(`
      SELECT m.*,
             json_object(
               'id', u1.id,
               'login', u1.login,
               'displayName', u1.display_name,
               'profileImageUrl', u1.profile_image_url
             ) as fromUser,
             json_object(
               'id', u2.id,
               'login', u2.login,
               'displayName', u2.display_name,
               'profileImageUrl', u2.profile_image_url
             ) as toUser
      FROM messages m
      JOIN users u1 ON m.from_user_id = u1.id
      JOIN users u2 ON m.to_user_id = u2.id
      WHERE m.request_id = ?
      ORDER BY m.created_at ASC
    `, [requestId]);

    messages.forEach(m => {
      m.fromUser = JSON.parse(m.fromUser);
      m.toUser = JSON.parse(m.toUser);
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const { content, requestId, fromUserId, toUserId, fromUser } = req.body;
    const db = await getDb();

    const messageId = uuidv4();
    await db.run(`
      INSERT INTO messages (id, request_id, from_user_id, to_user_id, content)
      VALUES (?, ?, ?, ?, ?)
    `, [messageId, requestId, fromUserId, toUserId, content]);

    const message = {
      id: messageId,
      requestId,
      content,
      fromUser,
      toUser: await db.get('SELECT * FROM users WHERE id = ?', [toUserId]),
      createdAt: new Date().toISOString(),
      read: false
    };

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's messages
router.get('/users/:userId/messages', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await getDb();
    
    const messages = await db.all(`
      SELECT m.*,
             json_object(
               'id', u1.id,
               'login', u1.login,
               'displayName', u1.display_name,
               'profileImageUrl', u1.profile_image_url
             ) as fromUser,
             json_object(
               'id', u2.id,
               'login', u2.login,
               'displayName', u2.display_name,
               'profileImageUrl', u2.profile_image_url
             ) as toUser
      FROM messages m
      JOIN users u1 ON m.from_user_id = u1.id
      JOIN users u2 ON m.to_user_id = u2.id
      WHERE m.from_user_id = ? OR m.to_user_id = ?
      ORDER BY m.created_at DESC
    `, [userId, userId]);

    messages.forEach(m => {
      m.fromUser = JSON.parse(m.fromUser);
      m.toUser = JSON.parse(m.toUser);
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});