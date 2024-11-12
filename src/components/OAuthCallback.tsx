import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { getTwitchUser } from '../lib/twitch';
import { Loader2 } from 'lucide-react';

export function OAuthCallback() {
  const navigate = useNavigate();
  const { setUser, setError } = useStore();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        let accessToken;
        
        // Check if we're handling a new login or using existing token
        if (window.location.hash) {
          // Handle new login flow
          const hashPart = window.location.href.split('#')[1];
          const params = new URLSearchParams(hashPart);
          accessToken = params.get('access_token');
          const error = params.get('error');
          const errorDescription = params.get('error_description');

          if (error || errorDescription) {
            throw new Error(errorDescription || 'Authentication failed');
          }

          if (!accessToken) {
            throw new Error('No access token provided');
          }

          // Store new token
          localStorage.setItem('twitch_token', accessToken);
        } else {
          // Check for existing token
          accessToken = localStorage.getItem('twitch_token');
          if (!accessToken) {
            localStorage.removeItem('twitch_user_id');
            navigate('/', { replace: true });
            return;
          }
        }
        
        // Try to get user data with token
        try {
          const userData = await getTwitchUser(accessToken);
          setUser(userData);
          navigate('/', { replace: true });
        } catch (error) {
          // If token is invalid, clear all auth data
          localStorage.removeItem('twitch_token');
          localStorage.removeItem('twitch_user_id');
          throw error;
        }

      } catch (error) {
        console.error('Auth error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        navigate('/', { replace: true });
      }
    };

    handleAuth();
  }, [navigate, setUser, setError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Authenticating with Twitch...</p>
      </div>
    </div>
  );
}