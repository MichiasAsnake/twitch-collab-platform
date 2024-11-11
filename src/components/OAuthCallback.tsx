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
        // Get the full URL including hash
        const fullUrl = window.location.href;
        console.log('Full callback URL:', fullUrl);

        // Get everything after the # symbol
        const hashPart = fullUrl.split('#')[1];
        if (!hashPart) {
          throw new Error('No hash parameters found in URL');
        }

        const params = new URLSearchParams(hashPart);
        const accessToken = params.get('access_token');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        console.log('Auth params:', { 
          hasToken: !!accessToken, 
          error, 
          errorDescription 
        });

        if (error || errorDescription) {
          throw new Error(errorDescription || 'Authentication failed');
        }

        if (!accessToken) {
          throw new Error('No access token provided');
        }

        // Store token first
        localStorage.setItem('twitch_token', accessToken);
        
        console.log('Fetching Twitch user data...');
        const userData = await getTwitchUser(accessToken);
        console.log('User data received:', userData.displayName);

        setUser(userData);
        
        // Navigate home with replace to prevent back navigation
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Auth error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        navigate('/', { replace: true });
      }
    };

    // Run the auth handler
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