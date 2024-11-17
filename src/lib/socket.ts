import { io } from 'socket.io-client';

// Create a singleton socket instance
const socket = io(import.meta.env.VITE_WS_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

export { socket };

// Add these listeners
socket.on('connect', () => {
  console.log('Socket connected!', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

// Debug all incoming events
socket.onAny((eventName, ...args) => {
  console.log('Received event:', eventName, args);
});