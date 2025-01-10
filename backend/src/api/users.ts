import { Router } from 'express';
import { pool } from '../../lib/db';  // Update this line

const router = Router();

router.put('/:userId/status', async (req, res) => {
  const { userId } = req.params;
  const { isLive } = req.body;
  
  try {
    await pool.query(
      'UPDATE users SET is_live = $1 WHERE id = $2',
      [isLive, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user live status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router; 