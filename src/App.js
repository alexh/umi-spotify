import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import CarView from './components/CarView';
import Login from './components/Login';
import Player from './components/Player';
import SimpleMusicPage from './components/SimpleMusicPage';
import MatrixRain from './components/MatrixRain';
import CRTEffect from './components/CRTEffect';
import { getAccessToken, getUserProfile } from './spotifyApi';
import { ThemeContext } from './themes';
import { ThemeManager } from './components/SharedComponents';

function LoadingSequence({ onLoadingComplete, onMusicStart }) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const loadingSteps = [
    "Initializing system...",
    "Loading core components...",
    "Connecting to Spotify...",
    "Preparing audio drivers...",
    "Calibrating visual interface...",
    "Optimizing playback engine...",
    "Synchronizing playlists...",
    "Tuning radio frequencies...",
    "Polishing the cogs...",
    "Adjusting gear ratios...",
    "Lubricating sprockets...",
    "Tightening bolts...",
    "Aligning drive shafts...",
    "Charging capacitors...",
    "Priming fuel injectors...",
    "Engaging clutch...",
    "Revving up the engine...",
    "Checking oil pressure...",
    "Testing suspension...",
    "Ready to launch!"
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const totalDuration = 4000; // 4 seconds in milliseconds
    const stepDuration = totalDuration / loadingSteps.length;
    let timer;

    const advanceLoading = (step) => {
      if (step < loadingSteps.length) {
        setLoadingStep(step);
        timer = setTimeout(() => advanceLoading(step + 1), stepDuration);
      } else {
        setIsLoadingComplete(true);
      }
    };

    advanceLoading(0);

    return () => {
      clearTimeout(timer);
    };
  }, [loadingSteps.length]);

  const handleStart = () => {
    // Immediately complete loading and advance to main screen
    onLoadingComplete();

    // Play intro sound and start music when it's done
    const audio = new Audio(Math.random() < 0.5 ? '/cog1.mp3' : '/cog2.mp3');
    audio.play().then(() => {
      audio.addEventListener('ended', () => {
        onMusicStart();
      });
    }).catch(error => {
      console.error("Error playing audio:", error);
      onMusicStart();
    });
  };

  const progressBar = (progress) => {
    const barLength = 20;
    const filledLength = Math.round(progress * barLength);
    return '[' + '='.repeat(filledLength) + ' '.repeat(barLength - filledLength) + ']';
  };

  if (!isLoadingComplete) {
    return (
      <CRTEffect>
        <div className="fixed inset-0 bg-[#FF5F00] z-50 flex flex-col items-center justify-center font-receipt">
          <div className="text-pantone-165-darker text-6xl font-nickel mb-8 animate-textPulse text-shadow">96.1 The Cog</div>
          {!isMobile && (
            <pre className="text-pantone-165-darker text-shadow text-xl mb-4 whitespace-pre-wrap text-center">
              {`
         ___   __    _   _____ _             ____            
        / _ \\ / /_  / | |_   _| |__   ___   / ___|___   __ _ 
        | (_) | '_ \\ | |   | | | '_ \\ / _ \\ | |   / _ \\ / _\` |
        \\__, | (_) || |   | | | | | |  __/ | |__| (_) | (_| |
           /_/ \\___(_)_|   |_| |_| |_|\\___|  \\____\\___/ \\__, |
                                                        |___/ 
              `}
            </pre>
          )}
          <div className="text-pantone-165-darker font-receipt text-xl mb-2">{progressBar((loadingStep + 1) / loadingSteps.length)}</div>
          <div className="text-pantone-165-darker font-receipt text-xl mb-4">{Math.round(((loadingStep + 1) / loadingSteps.length) * 100)}%</div>
          <div className="text-pantone-165-darker font-receipt text-lg">{loadingSteps[loadingStep]}</div>
        </div>
      </CRTEffect>
    );
  }

  return (
    <CRTEffect>
      <div className="fixed inset-0 bg-[#FF5F00] z-50 font-receipt flex flex-col items-center justify-center">
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="text-pantone-165-darker text-6xl font-nickel mb-8 animate-textPulse text-shadow">96.1 The Cog</div>
          <button 
            className="bg-pantone-165 text-white text-shadow px-8 py-4 rounded mt-4 text-4xl font-bold hover:bg-pantone-165-darker transition-colors duration-200 relative"
            onClick={handleStart}
          >
            <span className="relative z-10">Click to Start</span>
            <div className="absolute inset-0 rounded-lg shadow-[2px_2px_0_#CC4C19,_4px_4px_0_#FF5F00] bg-pantone-165 hover:bg-pantone-165-darker transition-colors duration-200  -m-1"></div>
          </button>
        </div>
        <MatrixRain />
      </div>
    </CRTEffect>
  );
}

function AppContent({ token, isPlaying, currentSong, currentArtist, playerControls, onLogout, isIntro }) {
  console.log('AppContent rendering', { token, isPlaying, currentSong, currentArtist, playerControls, isIntro });

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/simple" replace />} />
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
        />
      } />
      <Route path="*" element={<Navigate to="/visualizer" replace />} />
    </Routes>
  );
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState("");
  const [currentArtist, setCurrentArtist] = useState("");
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [playerControls, setPlayerControls] = useState({
    togglePlay: () => console.log("Toggle play not yet initialized"),
    nextTrack: () => console.log("Next track not yet initialized"),
    previousTrack: () => console.log("Previous track not yet initialized")
  });
  const playerControlsRef = useRef(playerControls);
  const [isIntro, setIsIntro] = useState(true);
  const [theme, setTheme] = useState('default');

  const handleLogout = useCallback(() => {
    console.log("Logging out");
    localStorage.removeItem('spotify_access_token');
    setToken(null);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    console.log("Loading sequence completed");
    setIsLoading(false);
  }, []);

  const handleMusicStart = useCallback(() => {
    console.log("Music start triggered");
    // if (playerControlsRef.current && playerControlsRef.current.togglePlay) {
    //   playerControlsRef.current.togglePlay();
    // } else {
    //   console.error("Player controls not available for music start");
    // }
    // // Set a timeout to end the intro after the video has played twice (assuming the video is about 15 seconds long)
    setTimeout(() => {
      setIsIntro(false);
    }, 2000); // 30 seconds for two loops
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
  }, []);

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
    console.log("App render - Token:", token ? "Token exists" : "No token", "IsLoading:", isLoading, "IsInitializing:", isInitializing);
  }, [token, isLoading, isInitializing]);

  if (isInitializing) {
    return <div>Initializing...</div>;
  }

  if (!token) {
    console.log("No token, rendering Login component");
    return <Login />;
  }

  if (isLoading) {
    console.log("Is loading, rendering LoadingSequence component");
    return <LoadingSequence onLoadingComplete={handleLoadingComplete} onMusicStart={handleMusicStart} />;
  }

  console.log("Rendering main app content");
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ThemeManager>
        <Router>
          <div className="bg-[#FF5F00] min-h-screen">
            <AppContent 
              token={token}
              isPlaying={isPlaying}
              currentSong={currentSong}
              currentArtist={currentArtist}
              playerControls={playerControls}
              onLogout={handleLogout}
              isIntro={isIntro}
            />
            <Player
              token={token}
              isPlaying={isPlaying}
              onPlaybackStateChange={handlePlaybackStateChange}
              setPlayerControls={setPlayerControlsMemoized}
            />
          </div>
        </Router>
      </ThemeManager>
    </ThemeContext.Provider>
  );
}

export default App;