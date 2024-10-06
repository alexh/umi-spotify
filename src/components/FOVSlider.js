import React from 'react';
import { RetroWindow, OrangeSlider } from './SharedComponents';

function FOVSlider({ fov, setFOV, position, onPositionChange }) {
  return (
    <RetroWindow title="Camera FOV" position={position} onPositionChange={onPositionChange}>
      <OrangeSlider
        value={fov}
        onChange={(value) => setFOV(value)}
        min={30}
        max={120}
      />
      <div>FOV: {fov.toFixed(0)}°</div>
    </RetroWindow>
  );
}

export default FOVSlider;