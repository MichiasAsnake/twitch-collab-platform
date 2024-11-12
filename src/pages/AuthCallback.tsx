// When handling Twitch OAuth callback
const handleTwitchAuth = async (token: string) => {
  try {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': import.meta.env.VITE_TWITCH_CLIENT_ID
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('twitch_token', token);
      localStorage.setItem('twitch_user_id', data.data[0].id);
    }
  } catch (error) {
    console.error('Error getting user data:', error);
  }
}; 