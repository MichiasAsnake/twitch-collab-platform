import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db.js';
import { getWebSocket } from './websocket.js';

export const router = Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Auth header:', req.headers.authorization);
  console.log('Extracted token:', token);
  
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
        ) as user,
        COALESCE(ARRAY_AGG(rc.category) FILTER (WHERE rc.category IS NOT NULL), ARRAY[]::text[]) as categories
      FROM requests r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN request_categories rc ON r.id = rc.request_id
      GROUP BY r.id, u.id, u.login, u.display_name, u.profile_image_url, u.is_live, u.category, u.title
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
    const { title, description, categories, language, userId, user } = req.body;

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

    // Create request
    const requestId = uuidv4();
    await client.query(`
      INSERT INTO requests (id, user_id, title, description, language)
      VALUES ($1, $2, $3, $4, $5)
    `, [requestId, userId, title, description, language]);

    // Insert categories
    for (const category of categories) {
      await client.query(`
        INSERT INTO request_categories (request_id, category)
        VALUES ($1, $2)
      `, [requestId, category]);
    }

    await client.query('COMMIT');

    const newRequest = {
      id: requestId,
      userId,
      title,
      description,
      categories,
      language,
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
    const now = new Date().toISOString();

    await client.query(`
      INSERT INTO messages (id, request_id, from_user_id, to_user_id, content, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING created_at
    `, [messageId, requestId, fromUserId, toUserId, content, now]);

    const toUserResult = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [toUserId]
    );

    await client.query('COMMIT');

    const message = {
      id: messageId,
      requestId,
      content,
      createdAt: now,
      read: false,
      fromUser,
      toUser: {
        id: toUserResult.rows[0].id,
        login: toUserResult.rows[0].login,
        displayName: toUserResult.rows[0].display_name,
        profileImageUrl: toUserResult.rows[0].profile_image_url
      }
    };

    getWebSocket().broadcastMessage(message);
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

// Add this with your other routes
router.delete('/requests/:id', authMiddleware, async (req, res) => {
  const client = await getDb();
  try {
    const { id } = req.params;
    const { userId } = req.body;

    console.log('Request body:', req.body);
    console.log('UserID type:', typeof userId);

    await client.query('BEGIN');  // Start transaction

    const checkResult = await client.query(
      'SELECT user_id FROM requests WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    const ownerUserId = checkResult.rows[0].user_id;
    console.log('Owner ID type:', typeof ownerUserId);
    console.log('Comparing:', {
      requestingUserId: userId,
      ownerUserId: ownerUserId,
      areEqual: ownerUserId === userId
    });

    if (ownerUserId !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        error: 'Not authorized to delete this request',
        requestOwner: ownerUserId,
        requestingUser: userId
      });
    }

    console.log('Deleting messages...');
    const messageResult = await client.query('DELETE FROM messages WHERE request_id = $1', [id]);
    console.log(`Deleted ${messageResult.rowCount} messages`);
    
    console.log('Deleting request...');
    const requestResult = await client.query('DELETE FROM requests WHERE id = $1', [id]);
    console.log(`Deleted ${requestResult.rowCount} requests`);

    await client.query('COMMIT');
    console.log('Transaction committed successfully');

    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this new route with your other routes
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const response = await fetch('https://api.twitch.tv/helix/games/top?first=100', {
      headers: {
        'Authorization': `Bearer ${req.token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Twitch API');
    }

    const data = await response.json();
    const categories = data.data.map(game => ({
      id: game.id,
      name: game.name
    }));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this route with your other routes
router.post('/webhooks/twitch', async (req, res) => {
  try {
    const event = req.body;
    const isLive = event.type === 'stream.online';
    const userId = event.broadcaster_user_id;
    
    // Update database
    const pool = await getDb();
    
    // First update user's live status
    await pool.query('UPDATE users SET is_live = $1 WHERE id = $2', [isLive, userId]);
    
    // Then fetch all their requests to broadcast updated data
    const requests = await pool.query(`
      SELECT r.*, json_build_object(
        'id', u.id,
        'displayName', u.display_name,
        'profileImageUrl', u.profile_image_url,
        'isLive', u.is_live
      ) as user
      FROM requests r
      JOIN users u ON r.user_id = u.id
      WHERE u.id = $1
    `, [userId]);

    // Broadcast via WebSocket
    getWebSocket().handleStreamEvent(event);
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this new route
router.get('/users/:userId/status', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await getDb();
    
    const result = await pool.query(
      'SELECT is_live FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ isLive: result.rows[0].is_live });
  } catch (error) {
    console.error('Error fetching user status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

