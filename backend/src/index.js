import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes.js';
import { setupWebSocket } from './websocket.js';
import { initDb } from './db.js';

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
    methods: ['GET', 'POST'],
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
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add preflight OPTIONS handling
app.options('*', cors());

app.use(express.json());
app.use('/api', router);

setupWebSocket(io);

const port = process.env.PORT || 3000;

httpServer.listen(port, async () => {
  await initDb();
  console.log(`Server running on port ${port}`);
});