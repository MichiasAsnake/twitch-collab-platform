import { useQuery } from '@tanstack/react-query';
import { getAppAccessToken } from '../lib/twitch';

interface TwitchCategory {
  id: string;
  name: string;
  box_art_url?: string;
}

export function useTwitchCategories() {
  return useQuery<TwitchCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        let token = localStorage.getItem('twitch_token');
        const clientId = import.meta.env.VITE_TWITCH_CLIENT_ID?.trim();

        if (!clientId) {
          throw new Error('Twitch Client ID not configured');
        }
        
        // If no user token, get app token and store it
        if (!token) {
          token = await getAppAccessToken();
          // Store the app token temporarily
          localStorage.setItem('twitch_token', token);
        }

        console.log('Fetching categories with:', { 
          hasToken: !!token,
          hasClientId: !!clientId 
        });

        const response = await fetch('https://api.twitch.tv/helix/games/top?first=40', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Client-Id': clientId
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Categories fetch failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const data = await response.json();
        return data.data.map(game => ({
          id: game.id,
          name: game.name,
          box_art_url: game.box_art_url
        }));
      } catch (error) {
        console.error('Error in useTwitchCategories:', error);
        // Clear token if we got an auth error
        localStorage.removeItem('twitch_token');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1, // Only retry once
  });
} 