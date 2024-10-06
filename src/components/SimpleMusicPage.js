import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RetroWindow, NowPlayingOverlay, OrangeSlider } from './SharedComponents';
import Visualizer from './Visualizer';
import CRTEffect from './CRTEffect';
import ViewSwitcher from './ViewSwitcher';
import EditorEffects from './EditorEffects';

function MerchWindow({ position, onPositionChange }) {
  return (
    <RetroWindow title="Merch" position={position} onPositionChange={onPositionChange}>
      <div className="flex flex-col items-center" style={{ width: '200px', height: '350px' }}>
        <div style={{ width: '100%', height: '350px', overflow: 'hidden' }}>
          <img src="/merch.png" alt="Merchandise" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <a 
          href="https://utility.materials.nyc/products/hoodie" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-[#CC4C19] text-white px-4 py-2 mt-2 rounded hover:bg-[#FF8C00] transition-colors"
        >
          Buy Now
        </a>
      </div>
    </RetroWindow>
  );
}

function MusicControls({ isPlaying, onPlayPause, onNext, onPrevious, volume, onVolumeChange, position, onPositionChange }) {
  return (
    <RetroWindow title="Music Controls" position={position} onPositionChange={onPositionChange}>
      <div className="music-controls flex flex-col items-center justify-center min-w-60 p-2">
        <div className="flex justify-center space-x-8 mb-4 w-full">
          <span onClick={onPrevious} className="cursor-pointer text-2xl">◀◀</span>
          <span onClick={onPlayPause} className="cursor-pointer text-2xl">{isPlaying ? '||' : '▶'}</span>
          <span onClick={onNext} className="cursor-pointer text-2xl">▶▶</span>
        </div>
        <div className="w-full">
          <label htmlFor="volume" className="block text-center mb-2">Volume: </label>
          <OrangeSlider
            value={volume}
            onChange={onVolumeChange}
            min={0}
            max={100}
          />
        </div>
      </div>
    </RetroWindow>
  );
}

function LogoutWindow({ onLogout, position, onPositionChange }) {
  return (
    <RetroWindow title="System" position={position} onPositionChange={onPositionChange}>
      <div className="flex flex-col items-center">
        <button 
          onClick={onLogout}
          className="bg-pantone-165-dark text-white px-4 py-2 rounded hover:bg-pantone-165-darker transition-colors duration-300"
        >
          Logout
        </button>
      </div>
    </RetroWindow>
  );
}

function AlbumArtWindow({ albumArt, isIntro, position, onPositionChange, trackUrl }) {
  return (
    <RetroWindow title="Now Playing" position={position} onPositionChange={onPositionChange}>
      <div className="flex flex-col items-center" style={{ width: '200px', height: '230px' }}>
        {isIntro ? (
          <video
            src="/Cog.mp4"
            autoPlay
            muted
            loop
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
          />
        ) : albumArt ? (
          <a href={trackUrl} target="_blank" rel="noopener noreferrer">
            <img src={albumArt} alt="Album Art" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
          </a>
        ) : (
          <div className="w-full h-[200px] flex items-center justify-center bg-gray-200 text-gray-500">
            No Album Art
          </div>
        )}
        <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="mt-2">
          <img src="/spotify.png" alt="Spotify Logo" className="h-6" />
        </a>
      </div>
    </RetroWindow>
  );
}

function BarGraph({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) return;

    const barWidth = width / data.length;
    const maxValue = Math.max(...data);

    ctx.fillStyle = '#FF5F00';
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * height;
      ctx.fillRect(index * barWidth, height - barHeight, barWidth - 1, barHeight);
    });
  }, [data]);

  return <canvas ref={canvasRef} width="180" height="100" />;
}

function AudioAnalysisWindow({ audioData, position, onPositionChange }) {
  return (
    <RetroWindow title="Audio Analysis" position={position} onPositionChange={onPositionChange}>
      <div className="flex flex-col items-center" style={{ width: '200px', height: '150px' }}>
        <BarGraph data={audioData.frequencyData} />
        <div className="mt-2 text-xs">
          <p>Avg: {audioData.averageFrequency?.toFixed(2)}</p>
          <p>Bass: {audioData.bassFrequency?.toFixed(2)}</p>
          <p>Treble: {audioData.trebleFrequency?.toFixed(2)}</p>
        </div>
      </div>
    </RetroWindow>
  );
}

function SimpleMusicPage({ isPlaying, currentSong, currentArtist, playerControls, onLogout, isIntro }) {
  console.log('SimpleMusicPage rendering', { isPlaying, currentSong, currentArtist, playerControls });

  const [tempo, setTempo] = useState(null);
  const [volume, setVolume] = useState(50);
  const [score, setScore] = useState(0);
  const [windowPositions, setWindowPositions] = useState({
    music: { x: window.innerWidth - 300, y: window.innerHeight - 200 },
    merch: { x: window.innerWidth - 300, y: 200 },
    switcher: { x: window.innerWidth - 300, y: 80 },
    logout: { x: 20, y: window.innerHeight - 160 },
    albumArt: { x: 20, y: 80 }, // New position for album art window
    audioAnalysis: { x: 20, y: 300 }, // Position for the new audio analysis window
  });

  const [currentAlbumArt, setCurrentAlbumArt] = useState(null);
  const [audioData, setAudioData] = useState({ averageFrequency: 0, bassFrequency: 0, trebleFrequency: 0, frequencyData: [] });

  const updateTempoRef = useRef(null);
  const updateCurrentTrackRef = useRef(null);
  const updateAudioDataRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentTrackUrl, setCurrentTrackUrl] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    updateTempoRef.current = () => {
      if (playerControls && typeof playerControls.getTempo === 'function') {
        const newTempo = playerControls.getTempo();
        setTempo(newTempo);
      }
    };

    updateCurrentTrackRef.current = async () => {
      if (playerControls && playerControls.getCurrentTrack) {
        const track = await playerControls.getCurrentTrack();
        if (track && track.album && track.album.images && track.album.images.length > 0) {
          setCurrentAlbumArt(track.album.images[0].url);
          setCurrentTrackUrl(track.spotifyUrl || null);
        } else {
          setCurrentAlbumArt(null);
          setCurrentTrackUrl(null);
        }
      }
    };

    updateAudioDataRef.current = () => {
      if (playerControls && playerControls.getAudioData) {
        const newAudioData = playerControls.getAudioData();
        if (newAudioData) {
          setAudioData(prevData => ({
            ...prevData,
            ...newAudioData,
            frequencyData: newAudioData.frequencyData || prevData.frequencyData,
          }));
        }
      }
    };

    const tempoInterval = setInterval(() => updateTempoRef.current(), 1000);
    const trackInterval = setInterval(() => updateCurrentTrackRef.current(), 5000);
    const audioDataInterval = setInterval(() => updateAudioDataRef.current(), 100);

    // Initial update
    updateCurrentTrackRef.current();

    return () => {
      clearInterval(tempoInterval);
      clearInterval(trackInterval);
      clearInterval(audioDataInterval);
    };
  }, [playerControls]);

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    if (playerControls && typeof playerControls.setVolume === 'function') {
      playerControls.setVolume(newVolume / 100);
    }
  }, [playerControls]);

  const updateWindowPosition = (window, newPosition) => {
    setWindowPositions(prev => ({
      ...prev,
      [window]: newPosition
    }));
  };

  const updateScore = useCallback((newScore) => {
    setScore(prevScore => {
      console.log(`Updating score from ${prevScore} to ${newScore}`);
      return newScore;
    });
  }, []);

  const renderWindows = () => {
    const windows = [
      <AlbumArtWindow 
        key="albumArt"
        albumArt={currentAlbumArt}
        isIntro={isIntro}
        position={windowPositions.albumArt}
        onPositionChange={(newPos) => updateWindowPosition('albumArt', newPos)}
        trackUrl={currentTrackUrl}
      />,
      <MusicControls 
        key="music"
        isPlaying={isPlaying}
        onPlayPause={playerControls?.togglePlay}
        onNext={playerControls?.nextTrack}
        onPrevious={playerControls?.previousTrack}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        position={windowPositions.music}
        onPositionChange={(newPos) => updateWindowPosition('music', newPos)}
      />,
      <MerchWindow 
        key="merch"
        position={windowPositions.merch}
        onPositionChange={(newPos) => updateWindowPosition('merch', newPos)}
      />,
      !isMobile && (
        <ViewSwitcher 
          key="switcher"
        position={windowPositions.switcher}
        onPositionChange={(newPos) => updateWindowPosition('switcher', newPos)}
        />
      ),
      <LogoutWindow 
        key="logout"
        onLogout={onLogout}
        position={windowPositions.logout}
        onPositionChange={(newPos) => updateWindowPosition('logout', newPos)}
      />,
      // <AudioAnalysisWindow 
      //   key="audioAnalysis"
      //   audioData={audioData}
      //   position={windowPositions.audioAnalysis}
      //   onPositionChange={(newPos) => updateWindowPosition('audioAnalysis', newPos)}
      // />
    ];

    if (isMobile) {
      return (
        <div className="absolute inset-x-0 top-20 bottom-0 overflow-y-auto">
          <div className="flex flex-col items-center space-y-4 p-4 pb-20">
            {windows}
          </div>
        </div>
      );
    }

    return windows;
  };

  return (
    <CRTEffect isPlaying={isPlaying} tempo={tempo}>
      <div className="relative w-full h-full">
        <div className="absolute inset-0 z-10">
          <EditorEffects>
            <Visualizer 
              isPlaying={isPlaying} 
              updateScore={updateScore}
              volume={volume}
              audioAnalysis={null}
              isMobile={isMobile}
            />
          </EditorEffects>
        </div>
        
        <div className="relative z-20 w-full h-full">
          <NowPlayingOverlay 
            currentSong={currentSong} 
            artist={currentArtist} 
            score={score} 
            isMobile={isMobile} 
            trackUrl={currentTrackUrl}
          />
          {renderWindows()}
        </div>
      </div>
    </CRTEffect>
  );
}

export default SimpleMusicPage;