import React, { useState, useEffect, useCallback, useRef } from 'react';

// Add this function at the top of the file
function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent) || (window.innerWidth <= 768);
}

export function RetroWindow({ title, children, position, onPositionChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState(position);
  const dragStartRef = useRef(null);
  const windowRef = useRef(null);
  const [isMobile, setIsMobile] = useState(isMobileDevice());

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
      setIsMobile(isMobileDevice());
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

export function NowPlayingOverlay({ currentSong, artist, score, trackUrl }) {
  const [localIsMobile, setLocalIsMobile] = useState(isMobileDevice());

  useEffect(() => {
    const handleResize = () => {
      setLocalIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const marqueeText = `${currentSong} by ${artist}`;

  return currentSong && (
    <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-[#FF8C00] font-receipt p-2">
      <div className="border-2 border-[#CC4C19] p-2 flex items-center">
        {!localIsMobile && <div className="text-xl whitespace-nowrap pr-4">Score: {score || 0}</div>}
        <div className="flex-grow overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee">
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2 spotify-logo-filter animate-pulse" />
              <span className="mx-8 animate-color-shift">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2 spotify-logo-filter animate-pulse" />
              <span className="mx-8 animate-color-shift">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2 spotify-logo-filter animate-pulse" />
              <span className="mx-8 animate-color-shift">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2 spotify-logo-filter animate-pulse" />
              <span className="mx-8 animate-color-shift">{marqueeText}</span>
            </a>
          </div>
          <div className="inline-block animate-marquee" aria-hidden="true">
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2" />
              <span className="mx-8">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2" />
              <span className="mx-8">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2" />
              <span className="mx-8">{marqueeText}</span>
            </a>
            <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <img src="/spotify.png" alt="Spotify Logo" className="h-4 mx-2" />
              <span className="mx-8">{marqueeText}</span>
            </a>
          </div>
        </div>
        {!localIsMobile && (
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

export function MerchWindow({ position, onPositionChange }) {
  const [currentMerchIndex, setCurrentMerchIndex] = useState(0);
  const [merchImages, setMerchImages] = useState([]);

  useEffect(() => {
    // Load merch images
    const loadMerchImages = async () => {
      const images = [];
      let i = 1;
      for (let i = 1; ; i++) {
        try {
          const module = await import(`/public/merch/merch${i}.png`);
          images.push(module.default);
        } catch (error) {
          break; // Stop when no more images are found
        }
      }
      setMerchImages(images);
    };

    loadMerchImages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMerchIndex((prevIndex) => (prevIndex + 1) % merchImages.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [merchImages.length]);

  const handlePrevious = () => {
    setCurrentMerchIndex((prevIndex) => (prevIndex - 1 + merchImages.length) % merchImages.length);
  };

  const handleNext = () => {
    setCurrentMerchIndex((prevIndex) => (prevIndex + 1) % merchImages.length);
  };

  return (
    <RetroWindow title="Merch" position={position} onPositionChange={onPositionChange}>
      <div className="flex flex-col items-center" style={{ width: '200px', height: '400px' }}>
        <div style={{ width: '100%', height: '400px', overflow: 'hidden' }}>
          {merchImages.length > 0 && (
            <img 
              src={merchImages[currentMerchIndex]} 
              alt={`Merchandise ${currentMerchIndex + 1}`} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          )}
        </div>
        <div className="flex justify-between w-full mt-2">
          <button 
            onClick={handlePrevious}
            className="bg-[#CC4C19] text-white px-2 py-1 rounded hover:bg-[#FF8C00] transition-colors"
          >
            Previous
          </button>
          <button 
            onClick={handleNext}
            className="bg-[#CC4C19] text-white px-2 py-1 rounded hover:bg-[#FF8C00] transition-colors"
          >
            Next
          </button>
        </div>
        <a 
          href="https://utility.materials.nyc" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-[#CC4C19] text-white px-4 py-2 mt-2 rounded hover:bg-[#FF8C00] transition-colors w-full text-center"
        >
          Buy Now
        </a>
      </div>
    </RetroWindow>
  );
}

export default {
  RetroWindow,
  NowPlayingOverlay,
  OrangeSlider,
  MerchWindow
};