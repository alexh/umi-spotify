import React from 'react';
import SpotifyWebPlayer from 'react-spotify-web-playback';

function SpotifyPlayer({ token, playlist, isPlaying, onPlaybackStateChange }) {
  if (!token) return null;

  return (
    <SpotifyWebPlayer
      token={token}
      uris={playlist.tracks.items.map(item => item.track.uri)}
      play={isPlaying}
      callback={onPlaybackStateChange}
      styles={{
        activeColor: '#CC4C19',
        bgColor: '#FF5F1F',
        color: '#CC4C19',
        loaderColor: '#FFFFFF',
        sliderColor: '#CC4C19',
        trackArtistColor: '#000000',
        trackNameColor: '#000000',
        height: '70px',
      }}
    />
  );
}

export default SpotifyPlayer;