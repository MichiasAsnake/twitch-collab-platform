import { useEffect } from 'react';
import { useStore } from '../store';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { io } from 'socket.io-client';

export function useSocket() {
  const user = useStore((state) => state.user);

  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user]);

  const socket = io(import.meta.env.VITE_SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
}