import React, { useEffect, useRef } from 'react';

const CRTEffect = ({ children }) => {
  const canvasRef = useRef(null);
  const scriptRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrame;

    const snow = () => {
      const { width, height } = canvas;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 25;  // Increased opacity
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const animate = () => {
      snow();
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    // Create and append the script element
    scriptRef.current = document.createElement("script");
    scriptRef.current.src = "https://sdk.scdn.co/spotify-player.js";
    scriptRef.current.async = true;
    document.body.appendChild(scriptRef.current);

    return () => {
      cancelAnimationFrame(animationFrame);
      // Safely remove the script element if it exists
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
      }
    };
  }, []);

  return (
    <div className="crt-effect relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[#1b2838] z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#85908c] to-[#323431] z-10"></div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none z-20"
        width={window.innerWidth}
        height={window.innerHeight}
      ></canvas>
      <div className="absolute inset-0 bg-[url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/86186/crt.png')] bg-cover pointer-events-none z-30 opacity-50"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-30 pointer-events-none z-40"></div>
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(18,16,16,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-50"></div>
      <div className="relative z-60 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default CRTEffect;