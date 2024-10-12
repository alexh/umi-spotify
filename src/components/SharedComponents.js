import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { ThemeContext, themes } from '../themes';  // Update this line

// Add this function at the top of the file
function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent) || (window.innerWidth <= 768);
}

export function RetroWindow({ title, children, position, onPositionChange }) {
  const { theme } = useContext(ThemeContext);
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
      if (windowRef.current) {
        const windowRect = windowRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let newX = localPosition.x;
        let newY = localPosition.y;

        if (newX + windowRect.width > viewportWidth) {
          newX = viewportWidth - windowRect.width;
        }
        if (newY + windowRect.height > viewportHeight) {
          newY = viewportHeight - windowRect.height;
        }

        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;

        if (newX !== localPosition.x || newY !== localPosition.y) {
          setLocalPosition({ x: newX, y: newY });
          if (onPositionChange) {
            onPositionChange({ x: newX, y: newY });
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [localPosition, onPositionChange]);

  const windowStyle = isMobile
    ? { width: '100%', maxWidth: '300px' }
    : {
        position: 'absolute',
        left: `${localPosition.x}px`,
        top: `${localPosition.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        maxWidth: '300px',
      };

  // Function to darken a color
  const darkenColor = (color, amount) => {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) - amount)).toString(16)).substr(-2));
  };

  const shadowColor = darkenColor(themes[theme].primary, 50);

  return (
    <div 
      ref={windowRef}
      className={`border-2 rounded-none p-0.5 font-receipt ${isMobile ? 'w-full' : ''}`}
      style={{
        ...windowStyle,
        backgroundColor: themes[theme].primary,
        borderColor: themes[theme].secondary,
        color: themes[theme].text,
        boxShadow: `2px 2px 0 ${shadowColor}, 4px 4px 0 ${themes[theme].primary}`,
      }}
    >
      <div 
        className="p-1 mb-1.5 font-bold flex justify-between items-center"
        onMouseDown={!isMobile ? handleMouseDown : undefined}
        style={{ 
          cursor: isMobile ? 'default' : 'grab',
          backgroundColor: themes[theme].secondary,
          color: themes[theme].text,
        }}
      >
        <span>{title}</span>
      </div>
      <div className="p-2 flex justify-center" style={{ cursor: 'default', overflowX: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

export function NowPlayingOverlay({ currentSong, artist, score, _isMobile, trackUrl, city }) {
  const [localIsMobile, setLocalIsMobile] = useState(isMobileDevice());
  const { theme } = useContext(ThemeContext);
  const currentTheme = themes[theme];

  useEffect(() => {
    const handleResize = () => {
      setLocalIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const marqueeText = `${currentSong} by ${artist}`;

  return currentSong && (
    <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 font-receipt p-2" style={{ color: currentTheme.text }}>
      <div className="border-2 p-2 flex items-center" style={{ borderColor: currentTheme.secondary }}>
        {!localIsMobile && <div className="text-xl whitespace-nowrap pr-4" style={{ userSelect: 'none' }}>Score: {score || 0}</div>}
        <div className="flex-grow overflow-hidden whitespace-nowrap" key={theme}>
          <div className="inline-block animate-marquee">
            {[...Array(10)].map((_, index) => (
              <span key={index} className="inline-flex items-center mr-8">
                <img src="/spotify.png" alt="Spotify Logo" className="h-4 mr-2 spotify-logo-filter animate-pulse" style={{ filter: `brightness(0) saturate(100%) invert(${currentTheme.text === '#000000' ? '0' : '100'}%)` }} />
                <a 
                  href={trackUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="animate-color-shift hover:underline cursor-pointer" 
                  style={{ color: currentTheme.primary }}
                >
                  {marqueeText}
                </a>
              </span>
            ))}
          </div>
          <div className="inline-block animate-marquee2" aria-hidden="true">
            {[...Array(10)].map((_, index) => (
              <span key={index} className="inline-flex items-center mr-8">
                <img src="/spotify.png" alt="Spotify Logo" className="h-4 mr-2 spotify-logo-filter animate-pulse" style={{ filter: `brightness(0) saturate(100%) invert(${currentTheme.text === '#000000' ? '0' : '100'}%)` }} />
                <a 
                  href={trackUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="animate-color-shift hover:underline cursor-pointer" 
                  style={{ color: currentTheme.primary }}
                >
                  {marqueeText}
                </a>
              </span>
            ))}
          </div>
        </div>
        {!localIsMobile && (
          <div className="text-xl whitespace-nowrap pl-4">
            <span style={{ color: currentTheme.secondary, userSelect: 'none' }}>{city} |</span>
            <a href="https://utility.materials.nyc" className="hover:underline cursor-pointer" style={{ color: currentTheme.secondary }}> Utility Materials Inc.</a>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrangeSlider({ value, onChange, min = 0, max = 100 }) {
  const { theme } = useContext(ThemeContext);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const updateValue = useCallback((e) => {
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round(percentage * (max - min) + min);
    onChange(newValue);
  }, [max, min, onChange]);

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
  }, [isDragging, updateValue]);

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
      className="relative w-full h-4 cursor-pointer"
      onMouseDown={handleMouseDown}
      style={{ backgroundColor: themes[theme].secondary + '4D' }} // 30% opacity
    >
      <div 
        className="absolute top-0 left-0 h-full"
        style={{ width: `${percentage}%`, backgroundColor: themes[theme].primary }}
      />
      <div 
        className="absolute top-0 w-4 h-4 -mt-0.5 -ml-2 z-20"
        style={{ 
          left: `${percentage}%`, 
          backgroundColor: themes[theme].primary,
          borderColor: themes[theme].secondary,
          border: '2px solid',
          borderRadius: '2px'
        }}
      />
    </div>
  );
}

export function MerchWindow({ position, onPositionChange }) {
  const { theme } = useContext(ThemeContext);
  const [currentMerchIndex, setCurrentMerchIndex] = useState(0);
  const [merchImages, setMerchImages] = useState([]);
  const [windowSize, setWindowSize] = useState({ width: '100px', height: '200px' });

  useEffect(() => {
    // Load merch images
    const loadMerchImages = async () => {
      const images = [];
      for (let j = 1; ; j++) {
        try {
          const module = await import(`/public/merch/merch${j}.png`);
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

  useEffect(() => {
    const handleResize = () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      
      let width, height;
      if (vw < 640) { // Small screens
        width = '180px';
        height = '360px';
      } else if (vw < 1024) { // Medium screens
        width = '100px';
        height = '300px';
      } else { // Large screens
        width = '200px';
        height = '400px';
      }
      
      setWindowSize({ width, height });
    };

    handleResize(); // Call once to set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrevious = () => {
    setCurrentMerchIndex((prevIndex) => (prevIndex - 1 + merchImages.length) % merchImages.length);
  };

  const handleNext = () => {
    setCurrentMerchIndex((prevIndex) => (prevIndex + 1) % merchImages.length);
  };

  return (
    <RetroWindow title="Merch" position={position} onPositionChange={onPositionChange}>
      <div className="flex flex-col items-center" style={{ width: windowSize.width, height: windowSize.height }}>
        <div style={{ width: '100%', height: '80%', overflow: 'hidden' }}>
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
            style={{ backgroundColor: themes[theme].secondary, color: themes[theme].text }}
            className="px-2 py-1 rounded transition-colors text-sm"
          >
            Prev
          </button>
          <button 
            onClick={handleNext}
            style={{ backgroundColor: themes[theme].secondary, color: themes[theme].text }}
            className="px-2 py-1 rounded transition-colors text-sm"
          >
            Next
          </button>
        </div>
        <a 
          href="https://utility.materials.nyc" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ backgroundColor: themes[theme].secondary, color: themes[theme].text }}
          className="px-4 py-2 mt-2 rounded transition-colors w-full text-center text-sm"
        >
          Buy Now
        </a>
      </div>
    </RetroWindow>
  );
}

export function LogoutWindow({ onLogout, position, onPositionChange }) {
  const { theme } = useContext(ThemeContext);

  return (
    <RetroWindow title="System" position={position} onPositionChange={onPositionChange}>
      <div className="flex flex-col items-center">
        <button 
          onClick={onLogout}
          style={{
            backgroundColor: themes[theme].secondary,
            color: themes[theme].text
          }}
          className="px-4 py-2 rounded transition-colors duration-300 hover:opacity-80"
        >
          Logout
        </button>
      </div>
    </RetroWindow>
  );
}

export function ThemeSelector({ position, onPositionChange }) {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <RetroWindow title="Theme Selector" position={position} onPositionChange={onPositionChange}>
      <select 
        value={theme} 
        onChange={(e) => setTheme(e.target.value)}
        className="bg-pantone-165 text-pantone-165-darker px-2 py-1 rounded"
        style={{ backgroundColor: themes[theme].primary, color: themes[theme].text }}
      >
        <option value="default">Default</option>
        <option value="monochrome">Monochrome</option>
        <option value="night">Night Rider</option>
        <option value="cute">Materials Girl</option>
        <option value="ocean">Under The Sea</option>
        <option value="desert">Lisan al Gaib</option>
        <option value="arctic">Tundra</option>
        <option value="forest">Camo</option>
        <option value="neon">Neon</option>
        <option value="cog">Cog</option>
      </select>
    </RetroWindow>
  );
}

export function ViewSwitcher({ position, onPositionChange, currentView, handleViewSwitch}) {
  // const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  const oppositeView = currentView === 'visualizer' ? 'car' : 'visualizer';
  const buttonText = `Switch to ${oppositeView === 'visualizer' ? 'Visualizer' : 'Car'} View`;

  // const handleViewSwitch = () => {
  //   navigate(`/${oppositeView}`);
  // };

  return (
    <RetroWindow title="View Switcher" position={position} onPositionChange={onPositionChange}>
      <div className="flex flex-col items-center">
        <button 
          onClick={handleViewSwitch}
          style={{
            backgroundColor: themes[theme].secondary,
            color: themes[theme].text
          }}
          className="px-4 py-2 rounded transition-colors duration-300 hover:opacity-80 w-full text-center"
        >
          {buttonText}
        </button>
      </div>
    </RetroWindow>
  );
}


export function ThemeManager({ children }) {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    // Update CSS variables when the theme changes
    document.documentElement.style.setProperty('--theme-primary', themes[theme].primary);
    document.documentElement.style.setProperty('--theme-secondary', themes[theme].secondary);
    document.documentElement.style.setProperty('--theme-text', themes[theme].text);
    document.documentElement.style.setProperty('--theme-background', themes[theme].background);
  }, [theme]);

  return children;
}

export default {
  RetroWindow,
  NowPlayingOverlay,
  OrangeSlider,
  MerchWindow,
  LogoutWindow,
  ViewSwitcher,
  ThemeManager
};