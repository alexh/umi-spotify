import axios from 'axios';

export const getAccessToken = () => {
  return localStorage.getItem('spotify_access_token');
};

export const getUserProfile = async (token) => {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

export const getPlaylist = async (token, playlistId) => {
  const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getTrackAudioFeatures = async (token, trackId) => {
  const response = await axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getAudioAnalysis = async (token, trackId) => {
  const response = await axios.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;

console.log('Client ID:', CLIENT_ID); // This will log the client ID
console.log('Redirect URI:', REDIRECT_URI); // This will log the redirect URI

export const getLoginUrl = () => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-modify-playback-state',
    'user-read-playback-state',
    'streaming',
    'user-read-currently-playing',
    'playlist-read-private',
  ];

  return 'https://accounts.spotify.com/authorize' +
    '?response_type=token' +
    '&client_id=' + encodeURIComponent(CLIENT_ID) +
    '&scope=' + encodeURIComponent(scopes.join(' ')) +
    '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);
};