import { io } from 'socket.io-client';
import { useStore } from '../store';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
  const user = useStore.getState().user;
  if (user) {
    socket.emit('join', user.id);
  }
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('connect_timeout', () => {
  console.error('Socket connection timeout');
});

socket.on('message', (message) => {
  const store = useStore.getState();
  store.addMessage(message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
});

export function connectSocket() {
  if (!socket.connected) {
    try {
      socket.connect();
    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}