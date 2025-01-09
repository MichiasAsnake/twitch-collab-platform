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
  // ... your existing POST /requests code ...
});

// Delete request
router.delete('/:id', authMiddleware, async (req, res) => {
  // ... your existing DELETE /requests/:id code ...
});

export default router; 