import React, { useState, useEffect, useCallback } from 'react';
import Player from './components/Player';
import Visualizer from './components/Visualizer';
import Stars from './components/Stars';
import { getUserProfile, getPlaylist, getAudioAnalysis } from './spotifyApi';

const PLAYLIST_ID = '7FBYKQMPaOei5Fx2WcnhkU';

function InternalApp({ token, onSongChange, isPlaying, setIsPlaying, onPlayPause, onNext, onPrevious }) {
  const [user, setUser] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [volume, setVolume] = useState(1);
  const [audioAnalysis, setAudioAnalysis] = useState(null);
  const [currentTrackId, setCurrentTrackId] = useState(null);

  useEffect(() => {
    if (token) {
      getUserProfile(token).then(setUser);
      getPlaylist(token, PLAYLIST_ID).then(setPlaylist);
    }
  }, [token]);

  const handlePlaybackStateChange = useCallback((state) => {
    console.log("Playback state changed:", state);
    setIsPlaying(state.isPlaying);
    setVolume(state.volume);
    if (state.track && state.track.name) {
      onSongChange(`${state.track.name} - ${state.track.artists[0].name}`);
    }
    if (state.track && state.track.id && state.track.id !== currentTrackId) {
      setCurrentTrackId(state.track.id);
      getAudioAnalysis(token, state.track.id)
        .then(analysis => {
          console.log("Audio analysis fetched:", analysis);
          setAudioAnalysis(analysis);
        })
        .catch(error => {
          console.error("Error fetching audio analysis:", error);
          setAudioAnalysis(null);
        });
    }
  }, [token, currentTrackId, onSongChange, setIsPlaying]);

  return (
    <div className="clickable relative min-h-screen overflow-hidden bg-pantone-165 flex flex-col">
      <Visualizer 
        isPlaying={isPlaying} 
        volume={volume} 
        audioAnalysis={audioAnalysis}
      />
      <Stars isPlaying={isPlaying} volume={volume} />
      <div className="relative z-20 fixed top-0 left-0 p-5">
        <h1 className="text-4xl font-bold mb-4 text-shadow font-nickel text-2xl font-nickel-slanted text-pantone-165-dark">86.1 The Cog</h1>
        {user && <p className="mb-5 text-pantone-165-darker">Welcome, {user.display_name}!</p>}
      </div>
      {playlist && (
        <div className="w-full fixed bottom-0 left-0 right-0 bg-pantone-165 border-t-4 border-pantone-165-dark z-50">
          <Player 
            token={token} 
            playlist={playlist} 
            onPlaybackStateChange={handlePlaybackStateChange}
            onPlayPause={onPlayPause}
            onNext={onNext}
            onPrevious={onPrevious}
            isPlaying={isPlaying}
          />
        </div>
      )}
    </div>
  );
}

export default InternalApp;