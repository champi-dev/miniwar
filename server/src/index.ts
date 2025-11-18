import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { SocketManager } from './network/SocketManager.js';

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.io setup
const io = new SocketIOServer(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize socket manager
const socketManager = new SocketManager(io);
socketManager.initialize();

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
  🎮 VoxelWars Server Running
  ================================
  Port: ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Client URL: ${corsOptions.origin}
  ================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  socketManager.stop();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
