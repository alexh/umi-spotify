import React, { useState, useEffect } from 'react';
import './Login.css';
import MatrixRain from './MatrixRain';
import CRTEffect from './CRTEffect';
import NutsAndBolts from './NutsAndBolts';
import LocalRadioText from './LocalRadioText';

const steps = [
  "Welcome to 96.1 The Cog",
  "Initializing audio drivers...",
  "Connecting to Spotify servers...",
  "Ready. Press LOGIN to continue."
];

const Login = () => {
  const [visibleStepIndex, setVisibleStepIndex] = useState(-1);

  useEffect(() => {
    let currentStep = 0;
    let timeoutId;

    const showNextStep = () => {
      if (currentStep < steps.length) {
        setVisibleStepIndex(currentStep);
        currentStep++;
        timeoutId = setTimeout(showNextStep, 500);
      }
    };

    showNextStep();

    return () => clearTimeout(timeoutId);
  }, []);

  const handleLogin = () => {
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.REACT_APP_REDIRECT_URI || window.location.origin);
    const scopes = encodeURIComponent('user-read-private user-read-email user-modify-playback-state user-read-playback-state streaming');
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scopes}&show_dialog=true`;
    
    window.location.href = spotifyAuthUrl;
  };

  return (
    <CRTEffect>
      <div className="relative min-h-screen w-full overflow-hidden">
        <MatrixRain />
        <NutsAndBolts />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-pantone-165-darkest bg-opacity-80 text-pantone-165 font-receipt p-4 overflow-auto" style={{ zIndex: 2 }}>
          <div className="text-center bg-pantone-165-darker bg-opacity-90 border-4 border-pantone-165 p-4 sm:p-8 rounded-lg shadow-lg mx-auto w-full max-w-xl retro-box">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-nickel mb-2 sm:mb-4 text-pantone-165 whitespace-nowrap">96.1 The Cog</h1>
            <LocalRadioText />
            <div className="bg-pantone-165 bg-opacity-90 text-pantone-165-darker p-2 mb-4 rounded text-left min-h-[4rem] flex flex-col justify-center">
              {steps.map((step, index) => (
                <p key={index} className={`text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg transition-all duration-300 ${index <= visibleStepIndex ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-full'}`}>
                  <span className="blink">{'>'}</span> {step}
                </p>
              ))}
            </div>
            <button 
              onClick={handleLogin} 
              className={`bg-pantone-165 bg-opacity-90 text-pantone-165-darker px-4 py-2 sm:px-6 sm:py-3 rounded text-xs sm:text-sm md:text-base lg:text-lg transition-colors duration-300 hover:bg-pantone-165-darker hover:text-pantone-165 w-full retro-shadow ${visibleStepIndex === steps.length - 1 ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}
              disabled={visibleStepIndex !== steps.length - 1}
            >
              LOGIN
            </button>
          </div>
        </div>
      </div>
    </CRTEffect>
  );
};

export default Login;