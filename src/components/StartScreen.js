import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import CRTEffect from './CRTEffect';
import MatrixRain from './MatrixRain';

// Define rotation angles (in degrees)
const BUTTON_ROTATION_X = 20;
const BUTTON_ROTATION_Y_LEFT = -20;
const BUTTON_ROTATION_Y_RIGHT = 20;
const BUTTON_ROTATION_Z = 0;

const floatWiggle = keyframes`
  0% {
    transform: rotateX(${BUTTON_ROTATION_X}deg) 
               rotateY(${BUTTON_ROTATION_Y_LEFT}deg) 
               rotateZ(${BUTTON_ROTATION_Z}deg);
  }
  ${[...Array(99)].map((_, i) => {
    const t = (i + 1) / 99; // Normalized time from 0 to 1
    const y = Math.sin(t * Math.PI * 2) * 15;
    const x = Math.sin(t * Math.PI * 2 + Math.PI / 4) * 10; // Phase shift for x
    const rotateX = BUTTON_ROTATION_X + Math.sin(t * Math.PI * 2 + Math.PI / 3) * 5;
    const rotateY = (BUTTON_ROTATION_Y_LEFT + BUTTON_ROTATION_Y_RIGHT) / 2 + Math.sin(t * Math.PI * 2 + Math.PI / 2) * 15;
    const rotateZ = BUTTON_ROTATION_Z + Math.sin(t * Math.PI * 2 + Math.PI / 6) * 2;

    return `
      ${(t * 100).toFixed(2)}% {
        transform: translateY(${y.toFixed(2)}px) translateX(${x.toFixed(2)}px)
                   rotateX(${rotateX.toFixed(2)}deg) 
                   rotateY(${rotateY.toFixed(2)}deg) 
                   rotateZ(${rotateZ.toFixed(2)}deg);
      }
    `;
  }).join('\n')}
`;

const pulseAnimation = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px #FF5F00, 0 0 10px #FF5F00, 0 0 15px #FF5F00;
  }
  50% {
    box-shadow: 0 0 10px #FF5F00, 0 0 20px #FF5F00, 0 0 30px #FF5F00, 0 0 40px #FF5F00;
  }
`;

const sparkleAnimation = keyframes`
  0% {
    transform: translate(0, 0) scale(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(1) rotate(360deg);
    opacity: 0;
  }
`;

const Sparkle = styled.div`
  position: absolute;
  background: #FFD700;
  box-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 30px #FFD700, 0 0 40px #FFD700;
  filter: blur(2px);
  opacity: 0;
  animation: ${sparkleAnimation} 3s linear forwards;
`;

const StyledButton = styled.button`
  position: relative;
  background: linear-gradient(to bottom, #FF7F00, #FF5F00);
  color: white;
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.3);
  font-size: 2rem;
  font-weight: bold;
  font-family: 'receipt-narrow', monospace;
  padding: 20px 40px;
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.5s ease;
  transform-style: preserve-3d;
  ${({ isAnimating, isHovered }) => isAnimating && css`
    animation: ${isHovered 
      ? css`${pulseAnimation} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite` 
      : css`
          ${floatWiggle} 20s ease-in-out infinite,
          ${pulseAnimation} 4s cubic-bezier(0.4, 0, 0.6, 1) infinite
        `};
  `}

  &:before, &:after, &::before, &::after {
    content: '';
    position: absolute;
    background: #CC4C19;
    transition: all 0.5s ease;
  }

  &::before {
    width: calc(100% - 4px);
    height: 12px;
    transform: rotateX(-90deg);
    top: calc(100% - 2px);
    left: 2px;
    transform-origin: top;
    box-shadow: 0 0 5px #FF5F00, 0 0 10px #FF5F00;
  }

  &::after {
    width: 12px;
    height: calc(100% - 4px);
    transform: rotateY(90deg);
    top: 2px;
    right: -12px;
    transform-origin: left;
    box-shadow: 0 0 5px #FF5F00, 0 0 10px #FF5F00;
  }

  // New left side (button's right)
  &:before {
    width: 12px;
    height: calc(100% - 4px);
    transform: rotateY(-90deg);
    top: 2px;
    left: -12px;
    transform-origin: right;
    box-shadow: 0 0 5px #FF5F00, 0 0 10px #FF5F00;
  }

  // Corner edges
  &::before::after, &::after::before, &:before::after, &:after::before {
    content: '';
    position: absolute;
    background: #CC4C19;
    width: 12px;
    height: 12px;
    box-shadow: 0 0 3px #FF5F00, 0 0 6px #FF5F00;
  }

  &::before::after {
    right: -12px;
    bottom: -12px;
    transform: rotateY(-90deg) rotateX(-90deg);
  }

  &::after::before {
    right: -12px;
    top: -12px;
    transform: rotateY(-90deg) rotateX(90deg);
  }

  &:before::after {
    left: 0;
    bottom: -12px;
    transform: rotateY(90deg) rotateX(-90deg);
  }

  &:after::before {
    left: 0;
    top: -12px;
    transform: rotateY(90deg) rotateX(90deg);
  }

  // Add glow to the main button face
  box-shadow: 0 0 10px #FF5F00, 0 0 20px #FF5F00;
`;

const AnimatedButton = ({ children, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0, rotation: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 100); // Start animation after 100ms

    return () => clearTimeout(timer);
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setSparkles([]);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setMousePosition({ x: e.clientX - centerX, y: e.clientY - centerY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const animateOffset = () => {
      const attractionStrength = 1; // Adjust this value to change the magnetic effect
      const newX = Math.sin(Date.now() / 1000) * 10 + mousePosition.x * attractionStrength;
      const newY = Math.cos(Date.now() / 1500) * 5 + mousePosition.y * attractionStrength;
      const newRotation = (Math.sin(Date.now() / 2000) * 2);
      setOffset({ x: newX, y: newY, rotation: newRotation });
    };

    const intervalId = setInterval(animateOffset, 16); // 60 FPS
    return () => clearInterval(intervalId);
  }, [mousePosition]);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseMove = (e) => {
      if (!isHovered) return;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const maxRotation = 10;

      const rotateY = ((x - centerX) / centerX) * maxRotation;
      const rotateX = ((centerY - y) / centerY) * maxRotation;

      button.style.transform = `
        perspective(1000px)
        rotateX(${BUTTON_ROTATION_X + rotateX}deg)
        rotateY(${rotateY}deg)
        rotateZ(${BUTTON_ROTATION_Z}deg)
        translateZ(20px)
      `;
    };

    button.addEventListener('mousemove', handleMouseMove);
    return () => button.removeEventListener('mousemove', handleMouseMove);
  }, [isHovered]);

  const generateSparkle = (isChild = false) => {
    const side = Math.floor(Math.random() * 4);
    const size = isChild ? 3 + Math.random() * 3 : 4 + Math.random() * 5; // Increased size
    const distance = isChild ? 100 + Math.random() * 150 : 300 + Math.random() * 400; // Increased distance
    let x, y, tx, ty;

    switch(side) {
      case 0: // top
        x = Math.random() * 100 + '%';
        y = '0%';
        tx = (Math.random() - 0.5) * 400;
        ty = -distance;
        break;
      case 1: // right
        x = '100%';
        y = Math.random() * 100 + '%';
        tx = distance;
        ty = (Math.random() - 0.5) * 400;
        break;
      case 2: // bottom
        x = Math.random() * 100 + '%';
        y = '100%';
        tx = (Math.random() - 0.5) * 400;
        ty = distance;
        break;
      case 3: // left
        x = '0%';
        y = Math.random() * 100 + '%';
        tx = -distance;
        ty = (Math.random() - 0.5) * 400;
        break;
    }

    return {
      id: Math.random(),
      style: {
        left: x,
        top: y,
        width: `${size}px`,
        height: `${size}px`,
        '--tx': `${tx}px`,
        '--ty': `${ty}px`,
      },
      children: isChild ? [] : Array(5).fill().map(() => generateSparkle(true)) // Increased to 5 child sparkles
    };
  };

  useEffect(() => {
    if (isHovered) {
      const interval = setInterval(() => {
        setSparkles(prevSparkles => {
          const newSparkle = generateSparkle();
          return [...prevSparkles, newSparkle].slice(-30); // Increased to 30 parent sparkles
        });
      }, 30); // Decreased interval for more frequent sparkles

      return () => clearInterval(interval);
    }
  }, [isHovered]);

  const renderSparkle = (sparkle) => (
    <React.Fragment key={sparkle.id}>
      <Sparkle style={sparkle.style} />
      {sparkle.children.map((child, index) => (
        <Sparkle
          key={`${sparkle.id}-child-${index}`}
          style={{
            ...child.style,
            animationDelay: `${(index + 1) * 0.5}s`,
            animationDuration: '1.5s'
          }}
        />
      ))}
    </React.Fragment>
  );

  return (
    <StyledButton
      ref={buttonRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      isHovered={isHovered}
      isAnimating={isAnimating}
      style={{
        transform: `
          translate(${offset.x}px, ${offset.y}px)
          rotate(${offset.rotation}deg)
        `
      }}
    >
      {children}
      {sparkles.map(renderSparkle)}
    </StyledButton>
  );
};

function SparkleText({ children }) {
  const [sparkles, setSparkles] = useState([]);
  const textRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const generateSparkle = (isChild = false) => {
    const rect = textRef.current.getBoundingClientRect();
    const size = isChild ? 3 + Math.random() * 3 : 4 + Math.random() * 5;
    const distance = isChild ? 100 + Math.random() * 150 : 300 + Math.random() * 400;
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    const tx = (Math.random() - 0.5) * distance;
    const ty = (Math.random() - 0.5) * distance;

    return {
      id: Math.random(),
      style: {
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        '--tx': `${tx}px`,
        '--ty': `${ty}px`,
      },
      children: isChild ? [] : Array(5).fill().map(() => generateSparkle(true))
    };
  };

  useEffect(() => {
    if (isHovered) {
      const interval = setInterval(() => {
        setSparkles(prevSparkles => {
          const newSparkle = generateSparkle();
          return [...prevSparkles, newSparkle].slice(-30);
        });
      }, 30);

      return () => clearInterval(interval);
    } else {
      setSparkles([]);
    }
  }, [isHovered]);

  const renderSparkle = (sparkle) => (
    <React.Fragment key={sparkle.id}>
      <Sparkle style={sparkle.style} />
      {sparkle.children.map((child, index) => (
        <Sparkle
          key={`${sparkle.id}-child-${index}`}
          style={{
            ...child.style,
            animationDelay: `${(index + 1) * 0.5}s`,
            animationDuration: '1.5s'
          }}
        />
      ))}
    </React.Fragment>
  );

  return (
    <div 
      ref={textRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {sparkles.map(renderSparkle)}
    </div>
  );
}

function LoadingSequence({ onLoadingComplete, onMusicStart }) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);
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
    audioRef.current = new Audio('/static.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0; // Start with volume at 0
    
    audioRef.current.play().then(() => {
      setAudioPlaying(true);
      // Fade in the volume
      let volume = 0;
      fadeIntervalRef.current = setInterval(() => {
        volume = Math.min(volume + 0.01, 0.3);
        audioRef.current.volume = volume;
        if (volume >= 0.3) {
          clearInterval(fadeIntervalRef.current);
        }
      }, 100); // Adjust every 100ms for a smooth fade over ~3 seconds
    }).catch(error => {
      console.error("Audio autoplay failed:", error);
      setAudioPlaying(false);
    });

    return () => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const toggleAudio = () => {
    if (audioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => console.error("Audio playback failed:", error));
    }
    setAudioPlaying(!audioPlaying);
  };

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
  }, []);

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
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center font-receipt">
          <SparkleText>
            <div 
              className="text-[#FF5F00] text-6xl font-nickel mb-8 animate-textGlow tracking-wide"
              style={{ fontVariationSettings: '"slnt" 15, "wdth" 100' }}
            >
              96.1 The Cog
            </div>
          </SparkleText>
          {!isMobile && (
            <pre className="text-[#FF5F00] text-shadow text-xl mb-4 whitespace-pre-wrap text-center">
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
          <div className="text-[#FF5F00] font-receipt text-xl mb-2">{progressBar((loadingStep + 1) / loadingSteps.length)}</div>
          <div className="text-[#FF5F00] font-receipt text-xl mb-4">{Math.round(((loadingStep + 1) / loadingSteps.length) * 100)}%</div>
          <div className="text-[#FF5F00] font-receipt text-lg">{loadingSteps[loadingStep]}</div>
        </div>
      </CRTEffect>
    );
  }

  return (
    <CRTEffect>
      <div className="fixed inset-0 bg-black z-50 font-receipt flex flex-col items-center justify-center">
        <div className="relative z-10 flex flex-col items-center justify-center">
          <SparkleText>
            <div 
              className="text-[#FF5F00] text-6xl font-nickel mb-8 animate-textGlow select-none tracking-wide"
              style={{ fontVariationSettings: '"slnt" 15, "wdth" 100' }}
            >
              96.1 The Cog
            </div>
          </SparkleText>
          <AnimatedButton onClick={handleStart}>
            Click to Start
          </AnimatedButton>
        </div>
        <MatrixRain />
        <button 
          onClick={toggleAudio} 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-[#FF5F00] hover:text-[#FF8F40] transition-colors duration-300 z-50"
        >
          {audioPlaying ? 'Mute Static' : 'Play Static'}
        </button>
      </div>
    </CRTEffect>
  );
}

export { LoadingSequence, AnimatedButton };