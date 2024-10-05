import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import CarView from './components/CarView';
import InternalApp from './InternalApp';
import Login from './components/Login';
import Player from './components/Player';
import SpotifyPlayer from './components/SpotifyPlayer';
import SimpleMusicPage from './components/SimpleMusicPage';
import { getAccessToken, getUserProfile } from './spotifyApi';
import { RetroWindow } from './components/SharedComponents';
import ViewSwitcher from './components/ViewSwitcher';

function LoadingSequence() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-white text-4xl font-bold">Loading...</div>
    </div>
  );
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState("");
  const [currentArtist, setCurrentArtist] = useState("");
  const [token, setToken] = useState("");
  const [playlist, setPlaylist] = useState({ tracks: { items: [] } });
  const [playerControls, setPlayerControls] = useState({
    togglePlay: () => {},
    nextTrack: () => {},
    previousTrack: () => {}
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      const fetchedToken = getAccessToken();
      if (fetchedToken) {
        try {
          await getUserProfile(fetchedToken);
          setToken(fetchedToken);
        } catch (error) {
          console.error("Token validation failed:", error);
          localStorage.removeItem('spotify_access_token');
          setToken("");
        }
      }
      setIsLoading(false);
    };

    fetchToken();
  }, []);

  const handlePlayPause = useCallback(() => {
    console.log("Play/Pause triggered in App");
    playerControls.togglePlay();
  }, [playerControls]);

  const handleNext = useCallback(() => {
    console.log("Next track triggered in App");
    playerControls.nextTrack();
  }, [playerControls]);

  const handlePrevious = useCallback(() => {
    console.log("Previous track triggered in App");
    playerControls.previousTrack();
  }, [playerControls]);

  const handlePlaybackStateChange = useCallback((state) => {
    console.log("Playback state changed in App:", state);
    setIsPlaying(state.isPlaying);
    setCurrentSong(state.track?.name || "No track playing");
    setCurrentArtist(state.track?.artists?.map(artist => artist.name).join(', ') || "Unknown Artist");
  }, []);

  if (!token) {
    return <Login />;
  }

  return (
    <Router>
      {isLoading && <LoadingSequence />}
      <Routes>
        <Route path="/" element={
          <>
            <ViewSwitcher />
            <InternalApp 
              token={token}
              isPlaying={isPlaying}
              currentSong={currentSong}
              currentArtist={currentArtist}
              setPlaylist={setPlaylist}
            />
            <SpotifyPlayer
              token={token}
              playlist={playlist}
              isPlaying={isPlaying}
              onPlaybackStateChange={handlePlaybackStateChange}
            />
          </>
        } />
        <Route path="/car" element={
          <>
            <ViewSwitcher />
            <CarView 
              token={token}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrevious={handlePrevious}
              currentSong={currentSong}
              currentArtist={currentArtist}
            />
          </>
        } />
        <Route path="/simple" element={
          <>
            <ViewSwitcher />
            <SimpleMusicPage 
              isPlaying={isPlaying}
              currentSong={currentSong}
              currentArtist={currentArtist}
              playerControls={playerControls}
            />
          </>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Player
        token={token}
        playlist={playlist}
        isPlaying={isPlaying}
        onPlaybackStateChange={handlePlaybackStateChange}
        setPlayerControls={setPlayerControls}
      />
    </Router>
  );
}

export default App;