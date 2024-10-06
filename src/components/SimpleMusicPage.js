import React, { useState, useCallback, useEffect } from 'react';
import { RetroWindow, NowPlayingOverlay, OrangeSlider } from './SharedComponents';
import Visualizer from './Visualizer';
import CRTEffect from './CRTEffect';
import ViewSwitcher from './ViewSwitcher';

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
      <div className="music-controls min-w-60">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <button onClick={onPrevious} style={{ flex: 1 }}>◀◀</button>
          <button onClick={onPlayPause} style={{ flex: 1 }}>{isPlaying ? '||' : '▶'}</button>
          <button onClick={onNext} style={{ flex: 1 }}>▶▶</button>
        </div>
        <div>
          <label htmlFor="volume" style={{ display: 'block', marginBottom: '5px' }}>Volume: </label>
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

function SimpleMusicPage({ isPlaying, currentSong, currentArtist, playerControls }) {
  console.log('SimpleMusicPage rendering', { isPlaying, currentSong, currentArtist, playerControls });

  const [tempo, setTempo] = useState(null);
  const [volume, setVolume] = useState(50);
  const [score, setScore] = useState(0); // Add score state
  const [windowPositions, setWindowPositions] = useState({
    music: { x: window.innerWidth - 300, y: window.innerHeight - 200 },
    merch: { x: window.innerWidth - 300, y: 200 },
    switcher: { x: window.innerWidth - 300, y: 80 },
  });

  useEffect(() => {
    const updateTempo = () => {
      if (playerControls && typeof playerControls.getTempo === 'function') {
        const newTempo = playerControls.getTempo();
        console.log('Updating tempo:', newTempo);
        setTempo(newTempo);
      } else {
        console.log('playerControls or getTempo function is not available yet');
      }
    };

    updateTempo();
    const intervalId = setInterval(updateTempo, 1000);

    return () => clearInterval(intervalId);
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

  // Add a function to update the score
  const updateScore = useCallback((newScore) => {
    setScore(newScore);
  }, []);

  return (
    <CRTEffect isPlaying={isPlaying} tempo={tempo}>
      <div className="relative w-full h-full">
        <div className="absolute inset-0 z-10">
          <Visualizer isPlaying={isPlaying} updateScore={updateScore} />
        </div>
        
        <div className="relative z-20 w-full h-full">
          <NowPlayingOverlay currentSong={currentSong} artist={currentArtist} score={score} />
          <MusicControls 
            isPlaying={isPlaying}
            onPlayPause={playerControls?.togglePlay}
            onNext={playerControls?.nextTrack}
            onPrevious={playerControls?.previousTrack}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            position={windowPositions.music}
            onPositionChange={(newPos) => updateWindowPosition('music', newPos)}
          />
          <MerchWindow 
            position={windowPositions.merch}
            onPositionChange={(newPos) => updateWindowPosition('merch', newPos)}
          />
          <ViewSwitcher 
            position={windowPositions.switcher}
            onPositionChange={(newPos) => updateWindowPosition('switcher', newPos)}
          />
        </div>
      </div>
    </CRTEffect>
  );
}

export default SimpleMusicPage;