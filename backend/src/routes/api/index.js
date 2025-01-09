import { Router } from 'express';
import requestsRouter from './requests.js';

const router = Router();

router.options('*', (req, res) => {
  res.sendStatus(200);
});

router.use('/requests', requestsRouter);

export default router; 