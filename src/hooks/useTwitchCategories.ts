import { useQuery } from '@tanstack/react-query';
import { getAppAccessToken } from '../lib/twitch';

interface TwitchCategory {
  id: string;
  name: string;
  box_art_url?: string;
}

interface TwitchGameResponse {
  id: string;
  name: string;
  box_art_url: string;
}

export function useTwitchCategories() {
  return useQuery<TwitchCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const clientId = import.meta.env.VITE_TWITCH_CLIENT_ID?.trim();

        if (!clientId) {
          throw new Error('Twitch Client ID not configured');
        }

        // Get token - either user token or app token
        let token = localStorage.getItem('twitch_token');
        
        // Always get an app token if no user token exists
        if (!token) {
          console.log('No user token found, getting app token');
          token = await getAppAccessToken();
        }

        console.log('Fetching categories with:', { 
          hasToken: !!token,
          hasClientId: !!clientId,
          tokenType: token === localStorage.getItem('twitch_token') ? 'user' : 'app'
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
          
          // If we get an auth error and we were using a user token, try with an app token
          if (response.status === 401 && token === localStorage.getItem('twitch_token')) {
            console.log('Auth failed with user token, retrying with app token');
            token = await getAppAccessToken();
            const retryResponse = await fetch('https://api.twitch.tv/helix/games/top?first=40', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Client-Id': clientId
              }
            });
            if (!retryResponse.ok) {
              throw new Error(`Failed to fetch categories: ${retryResponse.status}`);
            }
            return (await retryResponse.json()).data.map((game: TwitchGameResponse) => ({
              id: game.id,
              name: game.name,
              box_art_url: game.box_art_url
            }));
          }
          
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const data = await response.json();
        return data.data.map((game: TwitchGameResponse) => ({
          id: game.id,
          name: game.name,
          box_art_url: game.box_art_url
        }));
      } catch (error) {
        console.error('Error in useTwitchCategories:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1, // Only retry once
  });
} 