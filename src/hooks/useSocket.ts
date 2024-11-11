import { useEffect } from 'react';
import { useStore } from '../store';
import { connectSocket, disconnectSocket } from '../lib/socket';

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
}