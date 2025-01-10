import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Request, Response, NextFunction } from 'express';
import { initDb } from './db';
import apiRouter from './routes/api/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://stirring-longma-bc41fd.netlify.app']
    : ['http://localhost:5173'],
  credentials: true
}));

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://stirring-longma-bc41fd.netlify.app']
      : ['http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')));
}

// Health check endpoint
app.get('/health', (_: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Root route handler
app.get('/', (_: Request, res: Response) => {
  res.json({
    message: 'Welcome to the Twitch Collab API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      requests: '/api/requests'
    }
  });
});

// Mount API routes
app.use('/api', apiRouter);

// API status route
app.get('/api', (_: Request, res: Response) => {
  res.json({ message: 'API is running' });
});

// Handle SPA routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
} else {
  // 404 handler for non-production
  app.use((_: Request, res: Response) => {
    res.status(404).json({ 
      error: 'Route not found',
      message: 'The requested endpoint does not exist'
    });
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const startServer = async () => {
  try {
    await initDb();
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default httpServer; 