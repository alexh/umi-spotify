import React, { useEffect, useRef } from 'react';

const MatrixRain = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Updated orange shades to be more orange and less yellow
    const orangeShades = ['#FF5F00', '#FF6F00', '#FF7F00', '#FF8F00', '#FF9F00'];
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    const words = [
      "UTILITY", "MATERIALS", "INCORPORATED", 
      "COG", "GEAR", "MACHINE", "INDUSTRY", "FACTORY", "WORK", 
      "PRODUCTION", "MANUFACTURING", "ENGINEERING", "DESIGN",
      "DESIGNED", "WITH", "THOUGHT"
    ];

    const getRandomGreekChar = () => {
      return String.fromCharCode(Math.floor(Math.random() * (0x03A9 - 0x0391 + 1)) + 0x0391);
    };

    const getRandomChar = (forceGreek = false) => {
      if (!forceGreek && Math.random() < 0.2) { // 20% chance to start a word
        return {
          word: words[Math.floor(Math.random() * words.length)],
          index: 0,
          needsGreekAfter: true
        };
      }
      return getRandomGreekChar();
    };

    const chars = new Array(columns).fill().map(() => getRandomChar());

    const draw = () => {
      ctx.fillStyle = 'rgba(255, 95, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const colorIndex = Math.floor(Math.random() * orangeShades.length);
        ctx.fillStyle = orangeShades[colorIndex];

        if (typeof chars[i] === 'object') {
          // Spelling out the word vertically
          ctx.fillStyle = `rgba(255, 255, 255, 1)`; // White color for English words
          ctx.fillText(chars[i].word[chars[i].index], i * fontSize, drops[i] * fontSize);
          chars[i].index++;
          if (chars[i].index >= chars[i].word.length) {
            chars[i] = getRandomGreekChar(); // Force a Greek character after the word
          }
        } else {
          ctx.fillText(chars[i], i * fontSize, drops[i] * fontSize);
          if (Math.random() > 0.95) {
            chars[i] = getRandomChar();
          }
        }

        drops[i]++;

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
          chars[i] = getRandomChar();
        }
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />;
};

export default MatrixRain;