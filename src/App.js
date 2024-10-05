import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import CarView from './components/CarView';
import InternalApp from './InternalApp';
import Login from './components/Login';
import Player from './components/Player';
import SpotifyPlayer from './components/SpotifyPlayer';
import SimpleMusicPage from './components/SimpleMusicPage';
import { getAccessToken, getUserProfile } from './spotifyApi';

function LoadingSequence() {
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Initializing system...",
    "Loading core components...",
    "Connecting to Spotify...",
    "Preparing audio drivers...",
    "Calibrating visual interface...",
    "Ready to launch!"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingStep((prevStep) => (prevStep < loadingSteps.length - 1 ? prevStep + 1 : prevStep));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const progressBar = (progress) => {
    const barLength = 20;
    const filledLength = Math.round(progress * barLength);
    return '[' + '='.repeat(filledLength) + ' '.repeat(barLength - filledLength) + ']';
  };

  return (
    <div className="fixed inset-0 bg-[#FF5F00] z-50 flex flex-col items-center justify-center font-mono">
      <div className="text-black text-4xl font-bold mb-8 animate-pulse">UMI OS v1.0</div>
      <pre className="text-black text-xl mb-4 whitespace-pre-wrap text-center">
        {`
   _    _ __  __ _____    ____   _____ 
  | |  | |  \\/  |_   _|  / __ \\ / ____|
  | |  | | \\  / | | |   | |  | | (___  
  | |  | | |\\/| | | |   | |  | |\\___ \\ 
  | |__| | |  | |_| |_  | |__| |____) |
   \\____/|_|  |_|_____|  \\____/|_____/ 
        `}
      </pre>
      <div className="text-black text-xl mb-2">{progressBar((loadingStep + 1) / loadingSteps.length)}</div>
      <div className="text-black text-xl mb-4">{Math.round(((loadingStep + 1) / loadingSteps.length) * 100)}%</div>
      <div className="text-black text-lg">{loadingSteps[loadingStep]}</div>
    </div>
  );
}

function AppContent({ token, isPlaying, currentSong, currentArtist, playlist, playerControls, handlePlaybackStateChange, setPlaylist }) {
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Show loading only on initial page load
    if (location.pathname === '/simple' && showLoading) {
      const timer = setTimeout(() => setShowLoading(false), 6000); // 6 seconds loading time
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [location, showLoading]);

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

  if (showLoading) {
    return <LoadingSequence />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/simple" replace />} />
      <Route path="/internal" element={
        <>
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
        <CarView 
          token={token}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          currentSong={currentSong}
          currentArtist={currentArtist}
        />
      } />
      <Route path="/simple" element={
        <SimpleMusicPage 
          isPlaying={isPlaying}
          currentSong={currentSong}
          currentArtist={currentArtist}
          playerControls={playerControls}
        />
      } />
      <Route path="*" element={<Navigate to="/simple" replace />} />
    </Routes>
  );
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState("");
  const [currentArtist, setCurrentArtist] = useState("");
  const [token, setToken] = useState(null);
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

  const handlePlaybackStateChange = useCallback((state) => {
    console.log("Playback state changed in App:", state);
    setIsPlaying(state.isPlaying);
    setCurrentSong(state.track?.name || "No track playing");
    setCurrentArtist(state.track?.artists?.map(artist => artist.name).join(', ') || "Unknown Artist");
  }, []);

  if (isLoading) {
    return <LoadingSequence />;
  }

  if (!token) {
    return <Login />;
  }

  return (
    <Router>
      <div className="bg-[#FF5F00] min-h-screen">
        <AppContent 
          token={token}
          isPlaying={isPlaying}
          currentSong={currentSong}
          currentArtist={currentArtist}
          playlist={playlist}
          playerControls={playerControls}
          handlePlaybackStateChange={handlePlaybackStateChange}
          setPlaylist={setPlaylist}
        />
        <Player
          token={token}
          playlist={playlist}
          isPlaying={isPlaying}
          onPlaybackStateChange={handlePlaybackStateChange}
          setPlayerControls={setPlayerControls}
        />
      </div>
    </Router>
  );
}

export default App;