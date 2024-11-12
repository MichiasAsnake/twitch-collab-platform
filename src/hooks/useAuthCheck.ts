import { useEffect } from 'react';
import { useStore } from '../store';
import { getTwitchUser } from '../lib/twitch';

export function useAuthCheck() {
  const { setUser } = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('twitch_token');
      if (!token) return;

      try {
        const userData = await getTwitchUser(token);
        setUser(userData);
      } catch (error) {
        // Token is invalid, remove it
        localStorage.removeItem('twitch_token');
      }
    };

    checkAuth();
  }, [setUser]);
} 