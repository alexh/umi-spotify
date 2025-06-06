import React, { useEffect, useRef } from 'react';

const MatrixRain = () => {
  const canvasRef = useRef(null);
  const englishCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const englishCanvas = englishCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const englishCtx = englishCanvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = englishCanvas.width = window.innerWidth;
      canvas.height = englishCanvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const orangeShades = ['#FF7F00', '#FF8F00', '#bb581b', '#ff7300', '#ff7700'];
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    const words = [
      "UTILITY", "MATERIALS", "INCORPORATED", 
      "COG", "GEAR", "MACHINE", "INDUSTRY", "FACTORY", "WORK", 
      "PRODUCTION", "MANUFACTURING", "ENGINEERING", "DESIGN",
      "DESIGNED", "WITH", "THOUGHT"
    ];

    const getRandomJapaneseChar = () => {
      return String.fromCharCode(0x30A0 + Math.random() * (0x30FF - 0x30A0 + 1));
    };

    const getRandomChar = () => {
      if (Math.random() < 0.2) {
        const word = words[Math.floor(Math.random() * words.length)];
        return {
          word: word,
          y: -Math.random() * canvas.height,
          mutatedChars: new Array(word.length).fill({ char: '', frames: 0 })
        };
      }
      return { char: getRandomJapaneseChar(), mutationFrames: 0 };
    };

    const chars = new Array(columns).fill().map(() => getRandomChar());
    const charOpacity = new Array(columns).fill(1);

    const mutationSequence = ['⚙️', '#', '@', '%', '&'];

    const mutateChar = (char) => {
      if (char.mutationFrames > 0) {
        char.mutationFrames--;
        return mutationSequence[char.mutationFrames % mutationSequence.length];
      }
      return char.char;
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      englishCtx.clearRect(0, 0, englishCanvas.width, englishCanvas.height);

      ctx.font = `bold ${fontSize}px monospace`;
      englishCtx.font = `bold ${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const colorIndex = Math.floor(Math.random() * orangeShades.length);
        const baseColor = orangeShades[colorIndex];

        if (typeof chars[i] === 'object' && chars[i].word) {
          englishCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(charOpacity[i] * 1.5, 1)})`;
          englishCtx.shadowColor = 'white';
          englishCtx.shadowBlur = 15;
          for (let j = 0; j < chars[i].word.length; j++) {
            let displayChar = chars[i].word[j];
            if (chars[i].mutatedChars[j].frames > 0) {
              displayChar = mutationSequence[chars[i].mutatedChars[j].frames % mutationSequence.length];
              chars[i].mutatedChars[j].frames--;
            }
            englishCtx.fillText(displayChar, i * fontSize, chars[i].y + j * fontSize);
            
            if (Math.random() < 0.01 && chars[i].mutatedChars[j].frames === 0) {
              chars[i].mutatedChars[j] = { char: chars[i].word[j], frames: mutationSequence.length };
            }
          }
          englishCtx.shadowBlur = 0;
          
          chars[i].y += 1.5;
          
          // Reset only when the entire word has moved off the screen
          if (chars[i].y > canvas.height + chars[i].word.length * fontSize) {
            chars[i] = getRandomChar();
            charOpacity[i] = 1;
          }
        } else {
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 15;
          ctx.fillStyle = `rgba(${Math.min(parseInt(baseColor.slice(1, 3), 16) + 50, 255)}, 
                                 ${Math.min(parseInt(baseColor.slice(3, 5), 16) + 50, 255)}, 
                                 ${Math.min(parseInt(baseColor.slice(5, 7), 16) + 50, 255)}, 
                                 ${Math.min(charOpacity[i] * 1.5, 1)})`;
          
          let displayChar = mutateChar(chars[i]);
          ctx.fillText(displayChar, i * fontSize, drops[i] * fontSize);
          ctx.shadowBlur = 0;

          if (Math.random() < 0.7) {
            chars[i] = { char: getRandomJapaneseChar() };
          }
        }

        charOpacity[i] *= 0.995;

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.99) {
          drops[i] = 0;
          chars[i] = getRandomChar();
          charOpacity[i] = 1;
        }

        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />
      <canvas ref={englishCanvasRef} className="absolute top-0 left-0 w-full h-full" style={{ mixBlendMode: 'lighten' }} />
    </>
  );
};

export default MatrixRain;