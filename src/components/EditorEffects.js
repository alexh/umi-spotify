import React, { useState, useEffect, useMemo } from 'react';
import './EditorEffects.css'; // Make sure to create this CSS file

const EditorEffects = ({ children }) => {
  const [currentEffect, setCurrentEffect] = useState(null);

  const effects = useMemo(() => ({
    none: {
      name: 'None',
      style: {},
    },
    bradyBunch: {
      name: 'Brady Bunch',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        width: '100%',
        height: '100%',
      },
    },
    zoom: {
      name: 'Zoom',
      style: {
        transform: 'scale(1.5)',
        transition: 'transform 15s ease-in-out',
      },
    },
    flipbook: {
      name: 'Flipbook',
      style: {
        animation: 'flipBook 1s infinite linear',
        transformStyle: 'preserve-3d',
      },
    },
    glitch: {
      name: 'Glitch',
      style: {
        animation: 'glitch 0.2s infinite',
      },
    },
    deepFry: {
      name: 'Deep Fry',
      style: {
        filter: 'contrast(200%) saturate(200%)',
      },
    },
  }), []);

  useEffect(() => {
    const applyRandomEffect = () => {
      const effectKeys = Object.keys(effects).filter(key => key !== 'none');
      const randomEffect = effectKeys[Math.floor(Math.random() * effectKeys.length)];
      console.log("Applying effect:", randomEffect);
      setCurrentEffect(effects[randomEffect]);

      // Remove the effect after 15 seconds
      setTimeout(() => {
        console.log("Removing effect");
        setCurrentEffect(effects.none);
      }, 15000);
    };

    // Start with no effect
    setCurrentEffect(effects.none);

    // Wait for 60 seconds before applying the first effect
    const initialDelay = setTimeout(() => {
      applyRandomEffect();
      // Set up an interval to apply an effect every minute after the first one
      const interval = setInterval(applyRandomEffect, 60000);
      return () => clearInterval(interval);
    }, 60000);

    return () => clearTimeout(initialDelay);
  }, [effects]);

  if (!currentEffect || currentEffect.name === 'None') return children;

  if (currentEffect.name === 'Brady Bunch') {
    return (
      <div style={currentEffect.style} className={`editor-effect ${currentEffect.name.toLowerCase()}`}>
        {[...Array(9)].map((_, index) => (
          <div key={index} className="brady-bunch-cell">
            {React.cloneElement(children)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={currentEffect.style} className={`editor-effect ${currentEffect.name.toLowerCase()}`}>
      {children}
    </div>
  );
};

export default EditorEffects;