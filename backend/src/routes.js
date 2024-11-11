import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db.js';

export const router = Router();

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
    const pool = await getDb();
    const result = await pool.query(`
      SELECT 
        r.*,
        json_build_object(
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
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new request
router.post('/requests', authMiddleware, async (req, res) => {
  const client = await getDb();
  try {
    await client.query('BEGIN');
    const { title, description, category, userId, user } = req.body;

    // First ensure user exists
    await client.query(`
      INSERT INTO users (id, login, display_name, profile_image_url, is_live, category, title)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        login = EXCLUDED.login,
        display_name = EXCLUDED.display_name,
        profile_image_url = EXCLUDED.profile_image_url,
        is_live = EXCLUDED.is_live,
        category = EXCLUDED.category,
        title = EXCLUDED.title
    `, [
      user.id,
      user.login,
      user.displayName,
      user.profileImageUrl,
      user.isLive,
      user.category,
      user.title
    ]);

    // Then create request
    const requestId = uuidv4();
    await client.query(`
      INSERT INTO requests (id, user_id, title, description, category)
      VALUES ($1, $2, $3, $4, $5)
    `, [requestId, userId, title, description, category]);

    await client.query('COMMIT');

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
    await client.query('ROLLBACK');
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a request
router.get('/messages/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const pool = await getDb();
    
    const result = await pool.query(`
      SELECT 
        m.*,
        json_build_object(
          'id', u1.id,
          'login', u1.login,
          'displayName', u1.display_name,
          'profileImageUrl', u1.profile_image_url
        ) as "fromUser",
        json_build_object(
          'id', u2.id,
          'login', u2.login,
          'displayName', u2.display_name,
          'profileImageUrl', u2.profile_image_url
        ) as "toUser"
      FROM messages m
      JOIN users u1 ON m.from_user_id = u1.id
      JOIN users u2 ON m.to_user_id = u2.id
      WHERE m.request_id = $1
      ORDER BY m.created_at ASC
    `, [requestId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
router.post('/messages', authMiddleware, async (req, res) => {
  const client = await getDb();
  try {
    await client.query('BEGIN');
    const { content, requestId, fromUserId, toUserId, fromUser } = req.body;

    const messageId = uuidv4();
    await client.query(`
      INSERT INTO messages (id, request_id, from_user_id, to_user_id, content)
      VALUES ($1, $2, $3, $4, $5)
    `, [messageId, requestId, fromUserId, toUserId, content]);

    const toUserResult = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [toUserId]
    );

    await client.query('COMMIT');

    const message = {
      id: messageId,
      requestId,
      content,
      fromUser,
      toUser: toUserResult.rows[0],
      createdAt: new Date().toISOString(),
      read: false
    };

    res.status(201).json(message);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's messages
router.get('/users/:userId/messages', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await getDb();
    
    const result = await pool.query(`
      SELECT 
        m.*,
        json_build_object(
          'id', u1.id,
          'login', u1.login,
          'displayName', u1.display_name,
          'profileImageUrl', u1.profile_image_url
        ) as "fromUser",
        json_build_object(
          'id', u2.id,
          'login', u2.login,
          'displayName', u2.display_name,
          'profileImageUrl', u2.profile_image_url
        ) as "toUser"
      FROM messages m
      JOIN users u1 ON m.from_user_id = u1.id
      JOIN users u2 ON m.to_user_id = u2.id
      WHERE m.from_user_id = $1 OR m.to_user_id = $1
      ORDER BY m.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});