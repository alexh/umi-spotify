import React, { useState, useEffect, useCallback, useRef } from 'react';

export function RetroWindow({ title, children, position, onPositionChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState(position);
  const dragStartRef = useRef(null);
  const windowRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - localPosition.x, y: e.clientY - localPosition.y };
  }, [localPosition]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      e.preventDefault();
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      setLocalPosition({ x: newX, y: newY });
      if (onPositionChange) {
        onPositionChange({ x: newX, y: newY });
      }
    }
  }, [isDragging, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    setLocalPosition(position);
  }, [position]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const windowStyle = isMobile
    ? { width: '100%', maxWidth: '300px' }
    : {
        position: 'absolute',
        left: `${localPosition.x}px`,
        top: `${localPosition.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        maxWidth: '300px',
      };

  return (
    <div 
      ref={windowRef}
      className={`bg-[#FF5F00] border-2 border-[#CC4C19] rounded-none shadow-[2px_2px_0_#CC4C19,_4px_4px_0_#FF5F00] p-0.5 font-receipt text-black ${isMobile ? 'w-full' : ''}`}
      style={windowStyle}
    >
      <div 
        className="bg-[#CC4C19] p-1 mb-1.5 font-bold flex justify-between items-center"
        onMouseDown={!isMobile ? handleMouseDown : undefined}
        style={{ cursor: isMobile ? 'default' : 'grab' }}
      >
        <span>{title}</span>
      </div>
      <div className="p-2 flex justify-center" style={{ cursor: 'default', overflowX: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

export function NowPlayingOverlay({ currentSong, artist, score, isMobile, trackUrl }) {
  const marqueeText = `${currentSong} by ${artist}`;

  return currentSong && (
    <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-[#FF8C00] font-receipt p-2">
      <div className="border-2 border-[#CC4C19] p-2 flex items-center">
        {!isMobile && <div className="text-xl whitespace-nowrap pr-4">Score: {score || 0}</div>}
        <div className="flex-grow overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee">
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2 spotify-logo-filter animate-pulse" />
              <span className="mr-8 animate-color-shift">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2 spotify-logo-filter animate-pulse" />
              <span className="mr-8 animate-color-shift">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2 spotify-logo-filter animate-pulse" />
              <span className="mr-8 animate-color-shift">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2 spotify-logo-filter animate-pulse" />
              <span className="mr-8 animate-color-shift">{marqueeText}</span>
            </a>
          </div>
          <div className="inline-block animate-marquee" aria-hidden="true">
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2" />
              <span className="mr-8">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2" />
              <span className="mr-8">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2" />
              <span className="mr-8">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2" />
              <span className="mr-8">{marqueeText}</span>
            </a>
          </div>
        </div>
        {!isMobile && (
          <div className="text-xl whitespace-nowrap pl-4">
            <a href="https://utility.materials.nyc">Utility Materials Inc.</a>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrangeSlider({ value, onChange, min = 0, max = 100 }) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      updateValue(e);
    }
  }, [isDragging]);

  const updateValue = (e) => {
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round(percentage * (max - min) + min);
    onChange(newValue);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div 
      ref={sliderRef}
      className="relative w-full h-4 bg-[#FFD700] bg-opacity-30 cursor-pointer"
      onMouseDown={handleMouseDown}
    >
      <div 
        className="absolute top-0 left-0 h-full bg-[#FF4500] z-10"
        style={{ width: `${percentage}%` }}
      />
      <div 
        className="absolute top-0 w-4 h-4 bg-[#FF8C00] border-2 border-[#CC4C19] -mt-0.5 -ml-2 z-20"
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
}