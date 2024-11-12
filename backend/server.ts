import express from 'express';
import conversationsRouter from './routes/conversations';

// ... other imports and middleware ...

const app = express();
app.use('/api/conversations', conversationsRouter);