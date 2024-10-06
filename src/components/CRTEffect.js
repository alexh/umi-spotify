import React, { useEffect } from 'react';
import './CRTEffect.css';

const CRTEffect = ({ children, isPlaying, tempo }) => {

  useEffect(() => {
    console.log("CRTEffect updated:", { isPlaying, tempo });
    
    const container = document.body;
    if (!container) return;

    const textElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div:not(.retro-window):not(.retro-window *) > *:not(input):not(button):not(select):not(textarea)');

    let animationFrameId;
    const flickerText = () => {
      textElements.forEach(el => {
        const flickerAmount = Math.random() * 0.05 + 0.95; // Random value between 0.8 and 1
        el.style.opacity = flickerAmount;
        el.style.textShadow = `0 0 ${Math.random() * 5}px currentColor`;
      });
      animationFrameId = requestAnimationFrame(flickerText);
    };
    flickerText();
    // if (isPlaying) {
    //   flickerText();
    // } else {
    //   // Reset text styles when not playing
    //   textElements.forEach(el => {
    //     el.style.opacity = '';
    //     el.style.textShadow = '';
    //   });
    // }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      textElements.forEach(el => {
        el.style.opacity = '';
        el.style.textShadow = '';
      });
    };
  }, [isPlaying, tempo]);

  return (
    <div className="crt-container">
      <div className="screen">
        <div className="crt-content">{children}</div>
        <div className="overlay">
          <div className="scanlines"></div>
          <div className="crt-overlay"></div>
        </div>
      </div>
    </div>
  );
};

export default CRTEffect;