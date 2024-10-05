import React, { useState, useEffect } from 'react';
import asciiAnimation from '../ascii.json';

const LoadingScreen = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [currentFrame, setCurrentFrame] = useState(0);

  const bootSteps = [
    'Initializing system...',
    'Checking hardware...',
    'Loading kernel...',
    'Mounting file systems...',
    'Starting network services...',
    'Initializing audio drivers...',
    'Loading user interface...',
    'Connecting to Spotify...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => onLoadingComplete(), 100);
          return 100;
        }
        return prevProgress + 1;
      });

      setCurrentStep(bootSteps[Math.floor((progress / 100) * bootSteps.length)]);
      setCurrentFrame((prevFrame) => (prevFrame + 1) % asciiAnimation.length);
    }, 10); // Adjust timing as needed

    return () => clearInterval(interval);
  }, [progress, onLoadingComplete]);

  const getASCIILoadingBar = (percent) => {
    const width = 50;
    const filledWidth = Math.floor(width * (percent / 100));
    return '[' + '='.repeat(filledWidth) + ' '.repeat(width - filledWidth) + ']';
  };

  return (
    <div className="fixed inset-0 bg-pantone-165 text-pantone-165-darker font-receipt flex flex-col justify-center items-center">
      <div className="w-4/5 max-w-2xl">
        <h1 className="text-2xl mb-4 font-bold">86.1 The Cog OS v1.0</h1>
        {bootSteps.map((step, index) => (
          <p key={index} className={`${index === Math.floor((progress / 100) * bootSteps.length) ? 'text-pantone-165-dark' : ''}`}>
            {progress >= (index / bootSteps.length) * 100 ? '✓' : '○'} {step}
          </p>
        ))}
        <div className="mt-4 font-mono whitespace-pre">{getASCIILoadingBar(progress)}</div>
        <p className="mt-2">{progress}% Complete</p>
        {/* <div className="mt-4 font-mono whitespace-pre text-pantone-165-dark" dangerouslySetInnerHTML={{ __html: asciiAnimation[currentFrame] }} /> */}
      </div>
    </div>
  );
};

export default LoadingScreen;