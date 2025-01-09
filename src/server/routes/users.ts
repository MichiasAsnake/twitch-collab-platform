import { Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

router.get('/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const isLive = await checkStreamStatus(userId);
  
  res.json({ isLive });
});

async function checkStreamStatus(userId: string): Promise<boolean> {
  return false;
}

export default router; 