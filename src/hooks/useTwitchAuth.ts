import { useEffect } from 'react';
import { useStore } from '../store';
import { getTwitchUser } from '../lib/twitch';

export function useTwitchAuth() {
  const { setUser } = useStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');

    if (accessToken) {
      getTwitchUser(accessToken)
        .then(setUser)
        .catch(console.error);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setUser]);

  return null;
}