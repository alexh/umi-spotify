import React from 'react';
import { getLoginUrl } from '../spotifyApi';

function Login({ onLogin }) {
  const handleLogin = () => {
    const loginUrl = getLoginUrl();
    window.location.href = loginUrl;
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={handleLogin}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Login with Spotify
      </button>
    </div>
  );
}

export default Login;