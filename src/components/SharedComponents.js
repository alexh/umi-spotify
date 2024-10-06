import React, { useState, useEffect, useCallback, useRef } from 'react';

export function RetroWindow({ title, children, position, onPositionChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState(position);
  const dragStartRef = useRef(null);
  const windowRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - localPosition.x, y: e.clientY - localPosition.y };
  }, [localPosition]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      e.preventDefault();
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      setLocalPosition({ x: newX, y: newY });
      if (onPositionChange) {
        onPositionChange({ x: newX, y: newY });
      }
    }
  }, [isDragging, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    setLocalPosition(position);
  }, [position]);

  return (
    <div 
      ref={windowRef}
      className="absolute bg-[#FF5F00] border-2 border-[#CC4C19] rounded-none shadow-[2px_2px_0_#CC4C19,_4px_4px_0_#FF5F00] p-0.5 font-receipt text-black"
      style={{
        left: `${localPosition.x}px`,
        top: `${localPosition.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        maxWidth: '300px', // Ensure it doesn't exceed this width
      }}
    >
      <div 
        className="bg-[#CC4C19] p-1 mb-1.5 font-bold flex justify-between items-center"
        onMouseDown={handleMouseDown}
        style={{ cursor: 'grab' }}
      >
        <span>{title}</span>
      </div>
      <div className="p-2" style={{ cursor: 'default', overflowX: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

export function NowPlayingOverlay({ currentSong, artist, score }) {
  const marqueeText = `${currentSong} by ${artist} • `.repeat(10); // Repeat the text to ensure it's long enough

  return currentSong && (
    <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-[#FF8C00] font-receipt p-2">
      <div className="border-2 border-[#CC4C19] p-2 flex items-center">
        <div className="text-xl whitespace-nowrap pr-4">Score: {score || 0}</div>
        <div className="flex-grow overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee">
            <span className="inline-block px-4">{marqueeText}</span>
          </div>
        </div>
        <div className="text-xl whitespace-nowrap pl-4">
          <a href="https://utility.materials.nyc">Utility Materials Inc.</a>
        </div>
      </div>
    </div>
  );
}

export function OrangeSlider({ value, onChange, min = 0, max = 100 }) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      updateValue(e);
    }
  }, [isDragging]);

  const updateValue = (e) => {
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round(percentage * (max - min) + min);
    onChange(newValue);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div 
      ref={sliderRef}
      className="relative w-full h-4 bg-[#FFD700] bg-opacity-30 cursor-pointer"
      onMouseDown={handleMouseDown}
    >
      <div 
        className="absolute top-0 left-0 h-full bg-[#FF4500] z-10"
        style={{ width: `${percentage}%` }}
      />
      <div 
        className="absolute top-0 w-4 h-4 bg-[#FF8C00] border-2 border-[#CC4C19] -mt-0.5 -ml-2 z-20"
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
}