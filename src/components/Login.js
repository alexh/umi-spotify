import React from 'react';

const Login = () => {
  const handleLogin = () => {
    // Redirect to Spotify authorization URL
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.REACT_APP_REDIRECT_URI || window.location.origin);
    const scopes = encodeURIComponent('user-read-private user-read-email user-modify-playback-state user-read-playback-state streaming');
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scopes}&show_dialog=true`;
    
    window.location.href = spotifyAuthUrl;
  };

  return (
    <div className="login-container">
      <h1>Welcome to UMI Spotify Player</h1>
      <p>Please log in with your Spotify account to continue.</p>
      <button onClick={handleLogin} className="login-button">
        Login with Spotify
      </button>
    </div>
  );
};

export default Login;