import axios from 'axios';

export const getAccessToken = () => {
  // First, check if we have a token in localStorage
  const storedToken = localStorage.getItem('spotify_access_token');
  if (storedToken) {
    return storedToken;
  }

  // If not in localStorage, check the URL hash
  const hash = window.location.hash;
  if (!hash) {
    return null; // Return null if there's no hash (user hasn't logged in)
  }

  const token = hash
    .substring(1)
    .split('&')
    .find(elem => elem.startsWith('access_token'))
    ?.split('=')[1];

  if (token) {
    // If we found a token in the URL, store it in localStorage for future use
    localStorage.setItem('spotify_access_token', token);
    // Clear the hash from the URL
    window.location.hash = '';
  }

  return token || null;
};

export const getUserProfile = async (token) => {
  const response = await axios.get('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
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