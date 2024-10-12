import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import CarView from './components/CarView';
import Login from './components/Login';
import Player from './components/Player';
import SimpleMusicPage from './components/SimpleMusicPage';
import { LoadingSequence } from './components/StartScreen';
import { getAccessToken, getUserProfile } from './spotifyApi';
import { ThemeContext } from './themes';
import { ThemeManager } from './components/SharedComponents';
import { NowPlayingOverlay } from './components/SharedComponents';
import { fetchCityName } from './utils/locationUtils'; // Import the fetchCityName function

function AppContent({ token, isPlaying, currentSong, currentArtist, playerControls, onLogout, isIntro, theme, setTheme }) {
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleViewSwitch = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      if (location.pathname === '/car') {
        navigate('/visualizer');
      } else {
        navigate('/car');
      }
      setFadeOut(false);
    }, 500); // Adjust this timing to match your CSS transition
  }, [navigate, location.pathname]);

  return (
    <div className={`transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <Routes>
        <Route path="/" element={<Navigate to="/visualizer" replace />} />
        <Route path="/car" element={
          <CarView 
            token={token}
            isPlaying={isPlaying}
            onPlayPause={playerControls.togglePlay}
            onNext={playerControls.nextTrack}
            onPrevious={playerControls.previousTrack}
            currentSong={currentSong}
            currentArtist={currentArtist}
            onLogout={onLogout}
            playerControls={playerControls}
            onSwitchView={handleViewSwitch}
            theme={theme}
            setTheme={setTheme}
          />
        } />
        <Route path="/visualizer" element={
          <SimpleMusicPage 
            isPlaying={isPlaying}
            currentSong={currentSong}
            currentArtist={currentArtist}
            playerControls={playerControls}
            onLogout={onLogout}
            isIntro={isIntro}
            onSwitchView={handleViewSwitch}
            theme={theme}
            setTheme={setTheme}
          />
        } />
        <Route path="*" element={<Navigate to="/visualizer" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState("");
  const [currentArtist, setCurrentArtist] = useState("");
  const [token, setToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [playerControls, setPlayerControls] = useState({
    togglePlay: () => console.log("Toggle play not yet initialized"),
    nextTrack: () => console.log("Next track not yet initialized"),
    previousTrack: () => console.log("Previous track not yet initialized")
  });
  const playerControlsRef = useRef(playerControls);
  const [isIntro, setIsIntro] = useState(true);
  const [theme, setTheme] = useState('default');
  const [cityName, setCityName] = useState('Your City'); // Updated to display a default city name
  const [isLoading, setIsLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const attemptedAutoplayRef = useRef(false);

  const handleLogout = useCallback(() => {
    console.log("Logging out");
    localStorage.removeItem('spotify_access_token');
    setToken(null);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    console.log("Loading sequence completed");
    setIsLoading(false);
    attemptAutoplay();
  }, [attemptAutoplay]);

  const attemptAutoplay = useCallback(() => {
    if (sdkReady && !isLoading && !attemptedAutoplayRef.current) {
      console.log("Attempting autoplay");
      attemptedAutoplayRef.current = true;
      playerControlsRef.current.togglePlay();
    }
  }, [sdkReady, isLoading]);

  const handleMusicStart = useCallback(() => {
    console.log("Music start triggered");
    // Set a timeout to end the intro after a short delay
    setTimeout(() => {
      setIsIntro(false);
    }, 2000);
  }, []);

  const handlePlaybackStateChange = useCallback((state) => {
    console.log("Playback state changed in App:", state);
    setIsPlaying(state.isPlaying);
    setCurrentSong(state.track?.name || "No track playing");
    setCurrentArtist(state.track?.artists?.map(artist => artist.name).join(', ') || "Unknown Artist");
  }, []);

  const setPlayerControlsMemoized = useCallback((controls) => {
    console.log("Setting player controls:", controls);
    setPlayerControls(controls);
    playerControlsRef.current = controls;
    setSdkReady(true);
    attemptAutoplay();
  }, [attemptAutoplay]);

  useEffect(() => {
    const fetchToken = async () => {
      console.log("Fetching token...");
      // Check if the token is in the URL
      const hash = window.location.hash
        .substring(1)
        .split('&')
        .reduce((initial, item) => {
          if (item) {
            const parts = item.split('=');
            initial[parts[0]] = decodeURIComponent(parts[1]);
          }
          return initial;
        }, {});

      let fetchedToken = hash.access_token;

      if (fetchedToken) {
        console.log("Token found in URL, saving to localStorage");
        localStorage.setItem('spotify_access_token', fetchedToken);
        window.location.hash = '';
      } else {
        console.log("Token not found in URL, checking localStorage");
        fetchedToken = getAccessToken();
      }

      console.log("Fetched token:", fetchedToken ? "Token exists" : "No token");
      if (fetchedToken) {
        try {
          console.log("Validating token with Spotify API");
          await getUserProfile(fetchedToken);
          console.log("Token validated successfully");
          setToken(fetchedToken);
          setIsLoading(true); // Set loading to true when token is valid
        } catch (error) {
          console.error("Token validation failed:", error);
          localStorage.removeItem('spotify_access_token');
          setToken(null);
        }
      } else {
        console.log("No token found, user needs to log in");
        setToken(null);
      }
      setIsInitializing(false);
    };

    fetchToken();
  }, []);

  useEffect(() => {
    playerControlsRef.current = playerControls;
  }, [playerControls]);

  useEffect(() => {
    console.log("App render - Token:", token ? "Token exists" : "No token", "IsInitializing:", isInitializing);
  }, [token, isInitializing]);

  useEffect(() => {
    const getCityName = async () => {
      try {
        const city = await fetchCityName();
        setCityName(city || 'Your City');
      } catch (error) {
        console.error('Error fetching city name:', error);
        setCityName('Your City');
      }
    };

    getCityName();
  }, []);

  // if (isInitializing) {
  //   return <div>Initializing...</div>;
  // }

  if (!token) {
    console.log("No token, rendering Login component");
    return <Login />;
  }

  if (isLoading) {
    console.log("Is loading, rendering LoadingSequence component");
    return (
      <div className="bg-black">
        <LoadingSequence onLoadingComplete={handleLoadingComplete} onMusicStart={handleMusicStart} />
      </div>
    );
  }

  console.log("Rendering main app content");
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ThemeManager>
        <Router>
          <div className="bg-black min-h-screen">
            <AppContent 
              token={token}
              isPlaying={isPlaying}
              currentSong={currentSong}
              currentArtist={currentArtist}
              playerControls={playerControls}
              onLogout={handleLogout}
              isIntro={isIntro}
              theme={theme}
              setTheme={setTheme}
            />
            <Player
              token={token}
              isPlaying={isPlaying}
              onPlaybackStateChange={handlePlaybackStateChange}
              setPlayerControls={setPlayerControlsMemoized}
            />
            <NowPlayingOverlay
              currentSong={currentSong}
              artist={currentArtist}
              score={0} // Assuming score is not used here
              trackUrl={currentSong?.external_urls?.spotify}
              city={cityName} // Pass the city state here
            />
          </div>
        </Router>
      </ThemeManager>
    </ThemeContext.Provider>
  );
}

export default App;