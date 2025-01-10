import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db.js';

const router = express.Router();

// At the top of the file, add this middleware
router.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  console.log('Request Body:', req.body);
  next();
});

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

// Get all requests
router.get('/requests', async (req, res) => {
  console.log('GET /requests called');
  try {
    const result = await db.query('SELECT * FROM requests ORDER BY created_at DESC');
    console.log('Requests found:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create request
router.post('/requests', async (req, res) => {
  console.log('POST /requests called with body:', req.body);
  try {
    const { userId, title, description, language, categories } = req.body;
    console.log('Parsed request data:', { userId, title, description, language, categories });
    
    const requestId = uuidv4();
    console.log('Generated requestId:', requestId);
    
    // Start a transaction
    await db.query('BEGIN');
    console.log('Transaction started');
    
    // Insert request
    const result = await db.query(
      'INSERT INTO requests (id, user_id, title, description, language) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [requestId, userId, title, description, language]
    );
    console.log('Request inserted:', result.rows[0]);
    
    // Insert categories
    if (categories && categories.length > 0) {
      for (const category of categories) {
        await db.query(
          'INSERT INTO request_categories (request_id, category) VALUES ($1, $2)',
          [requestId, category]
        );
        console.log('Category inserted:', category);
      }
    }
    
    await db.query('COMMIT');
    console.log('Transaction committed');
    res.json(result.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Add this at the top of your routes, after the middleware
router.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Add this near your test route
router.get('/tables', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error checking tables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this near your test route
router.get('/requests/test', async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM requests');
    res.json({ count: result.rows[0].count });
  } catch (error) {
    console.error('Error testing requests table:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a test route to create a sample request
router.get('/requests/create-test', async (req, res) => {
  try {
    const result = await db.query(
      'INSERT INTO requests (id, user_id, title, description, language) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), 'test-user', 'Test Request', 'This is a test request', 'en']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating test request:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router };

