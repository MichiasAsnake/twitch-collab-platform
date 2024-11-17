import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import conversationsRouter from './routes/conversations';

// ... other imports and middleware ...

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors({
  origin: ['https://stirring-longma-bc41fd.netlify.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
  credentials: true
}));

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: ['https://stirring-longma-bc41fd.netlify.app', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
    credentials: true
  }
});

app.use('/api/conversations', conversationsRouter);