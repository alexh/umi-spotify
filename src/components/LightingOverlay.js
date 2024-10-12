import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const FullScreenOverlay = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.2;
  z-index: -1;
`;

const FullScreenImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  mix-blend-mode: screen;
  filter: ${props => `brightness(${props.brightness}) contrast(${props.contrast})`};
  opacity: 0.9;
  transition: filter 0.3s ease-in-out;
`;

const LightningOverlay = () => {
  const [brightness, setBrightness] = useState(1.5);
  const [contrast, setContrast] = useState(1.2);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Math.random() < 0.2) { // 20% chance of effect change every 100ms
        setBrightness(1.5 + Math.random() * 0.5); // Random brightness between 1.5 and 2
        setContrast(1.2 + Math.random() * 0.3);   // Random contrast between 1.2 and 1.5
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <FullScreenOverlay>
      <FullScreenImage 
        src="lightning2.gif" 
        alt="Lightning" 
        brightness={brightness}
        contrast={contrast}
      />
    </FullScreenOverlay>
  );
};

export default LightningOverlay;
