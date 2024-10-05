import React, { useState, useCallback } from 'react';
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
          href="https://utility.materials.nyc" 
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

function SimpleMusicPage({ isPlaying, currentSong, currentArtist, playerControls }) {
  const [windowPositions, setWindowPositions] = useState({
    music: { x: window.innerWidth - 250, y: window.innerHeight - 200 },
    merch: { x: window.innerWidth - 300, y: 200 },
    switcher: { x: window.innerWidth - 150, y: 20 }
  });
  const [volume, setVolume] = useState(50);  // Initial volume set to 50%

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    playerControls.setVolume(newVolume / 100);  // Convert to 0-1 range for Spotify API
  }, [playerControls]);

  const updateWindowPosition = (window, newPosition) => {
    setWindowPositions(prev => ({
      ...prev,
      [window]: newPosition
    }));
  };

  return (
    <CRTEffect>
      <div className="relative w-full h-full">
        <div className="absolute inset-0 z-10">
          <Visualizer isPlaying={isPlaying} />
        </div>
        
        <div className="relative z-20 w-full h-full">
          <NowPlayingOverlay currentSong={currentSong} artist={currentArtist} />
          <RetroWindow 
            title="Music Controls" 
            position={windowPositions.music}
            onPositionChange={(newPos) => updateWindowPosition('music', newPos)}
          >
            <div className="music-controls">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={playerControls.previousTrack} style={{ flex: 1 }}>◀◀</button>
                <button onClick={playerControls.togglePlay} style={{ flex: 1 }}>{isPlaying ? '||' : '▶'}</button>
                <button onClick={playerControls.nextTrack} style={{ flex: 1 }}>▶▶</button>
              </div>
              <div>
                <label htmlFor="volume" style={{ display: 'block', marginBottom: '5px' }}>Volume: </label>
                <OrangeSlider
                  value={volume}
                  onChange={handleVolumeChange}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </RetroWindow>
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