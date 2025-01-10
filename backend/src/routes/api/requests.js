import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/index.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();

// Get all requests
router.get('/', async (req, res) => {
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
router.post('/', authMiddleware, async (req, res) => {
  const pool = await getDb();
  const { userId, title, description, language, categories, user } = req.body;
  
  try {
    // Start transaction
    await pool.query('BEGIN');

    // Check if user exists, if not create them
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!userExists.rows.length) {
      await pool.query(
        'INSERT INTO users (id, login, display_name, profile_image_url, category, title) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          userId,
          user.login,
          user.displayName,
          user.profileImageUrl,
          user.category || null,
          user.title || null
        ]
      );
    }

    // Create the request
    const requestId = uuidv4();
    const result = await pool.query(
      'INSERT INTO requests (id, user_id, title, description, language) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [requestId, userId, title, description, language]
    );

    // Insert categories
    if (categories && categories.length > 0) {
      for (const category of categories) {
        await pool.query(
          'INSERT INTO request_categories (request_id, category) VALUES ($1, $2)',
          [requestId, category]
        );
      }
    }

    await pool.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request', details: error.message });
  }
});

// Delete request
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = await getDb();
    await pool.query('DELETE FROM requests WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 