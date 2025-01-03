import { Router } from 'express';
import { pool as db } from '../../lib/db';

const router = Router();

router.put('/api/users/:userId/status', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { isLive } = req.body;
  
  try {
    await db.query(
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