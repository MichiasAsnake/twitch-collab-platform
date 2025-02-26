import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api/index.js';
import { setupWebSocket } from './websocket.js';
import { initDb, getDb } from './db.js';
import { subscribeToStreamStatus } from './twitch.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Update CORS configuration to allow requests from the deployed frontend
const allowedOrigins = [
  'http://localhost:5173',
  'https://stirring-longma-bc41fd.netlify.app'
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Client-Id']
}));

// Add preflight OPTIONS handling for all routes
app.options('*', cors());

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use('/api', apiRouter);

setupWebSocket(io);

const port = process.env.PORT || 3000;

httpServer.listen(port, async () => {
  await initDb();
  
  // Subscribe to all existing users' stream status
  const pool = await getDb();
  const users = await pool.query('SELECT id FROM users');
  for (const { id } of users.rows) {
    await subscribeToStreamStatus(id);
  }
  
  console.log(`Server running on port ${port}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});