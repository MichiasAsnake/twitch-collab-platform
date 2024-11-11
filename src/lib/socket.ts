import { io } from 'socket.io-client';
import { useStore } from '../store';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
  const user = useStore.getState().user;
  if (user) {
    socket.emit('join', user.id);
  }
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
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}