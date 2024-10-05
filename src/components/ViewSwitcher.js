import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RetroWindow } from './SharedComponents';

function ViewSwitcher({ position, onPositionChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const switchView = () => {
    if (location.pathname === '/car') {
      navigate('/simple');
    } else {
      navigate('/car');
    }
  };

  // Provide a default position if it's not passed as a prop
  const defaultPosition = { x: window.innerWidth - 150, y: 20 };
  const safePosition = position || defaultPosition;

  return (
    <RetroWindow 
      title="View Switcher" 
      position={safePosition}
      onPositionChange={onPositionChange}
    >
      <button 
        onClick={switchView}
        className="bg-[#CC4C19] text-white px-4 py-2 rounded hover:bg-[#FF8C00] transition-colors"
      >
        Switch to {location.pathname === '/car' ? 'Simple' : 'Car'} View
      </button>
    </RetroWindow>
  );
}

export default ViewSwitcher;