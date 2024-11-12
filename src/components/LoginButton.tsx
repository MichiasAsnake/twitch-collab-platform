import React from 'react';
import { getTwitchAuthUrl } from '../lib/twitch';

export function LoginButton() {
  const handleLogin = () => {
    window.location.href = getTwitchAuthUrl();
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
    >
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
      </svg>
      Login with Twitch
    </button>
  );
} 