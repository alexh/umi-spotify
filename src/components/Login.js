import React, { useState, useEffect } from 'react';

const Login = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    "Welcome to UMI OS",
    "Initializing audio drivers...",
    "Connecting to Spotify servers...",
    "Ready. Press LOGIN to continue."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prevStep) => (prevStep < steps.length - 1 ? prevStep + 1 : prevStep));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogin = () => {
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.REACT_APP_REDIRECT_URI || window.location.origin);
    const scopes = encodeURIComponent('user-read-private user-read-email user-modify-playback-state user-read-playback-state streaming');
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scopes}&show_dialog=true`;
    
    window.location.href = spotifyAuthUrl;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pantone-165 text-pantone-165-darker font-receipt">
      <div className="text-center bg-pantone-165-darker border-4 border-pantone-165 p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="bg-pantone-165 text-pantone-165-darker p-2 mb-4 rounded">
          <h1 className="text-4xl uppercase tracking-widest">UMI OS v1.0</h1>
        </div>
        <pre className="text-xs mb-4 whitespace-pre-wrap text-pantone-165">
{`
   _    _ __  __ _____    ____   _____ 
  | |  | |  \\/  |_   _|  / __ \\ / ____|
  | |  | | \\  / | | |   | |  | | (___  
  | |  | | |\\/| | | |   | |  | |\\___ \\ 
  | |__| | |  | |_| |_  | |__| |____) |
   \\____/|_|  |_|_____|  \\____/|_____/ 
`}
        </pre>
        <div className="bg-pantone-165 text-pantone-165-darker p-2 mb-4 rounded text-left">
          {steps.map((step, index) => (
            <p key={index} className={`mb-2 ${index <= currentStep ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
              {'>'} {step}
            </p>
          ))}
        </div>
        <button 
          onClick={handleLogin} 
          className="bg-pantone-165 text-pantone-165-darker px-6 py-3 rounded text-lg transition-all duration-300 ease-in-out hover:bg-pantone-165-darker hover:text-pantone-165 transform hover:scale-105 border-2 border-pantone-165 hover:border-pantone-165-darker w-full"
          disabled={currentStep !== steps.length - 1}
        >
          LOGIN
        </button>
      </div>
    </div>
  );
};

export default Login;