import React from 'react';

function CarScreen({ currentSong, isPlaying, onPlayPause, onNext, onPrevious }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0' }}>Now Playing: {currentSong || "No song playing"}</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button onClick={onPrevious} style={buttonStyle}>Previous</button>
        <button onClick={onPlayPause} style={buttonStyle}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: '10px 20px',
  fontSize: '18px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

export default CarScreen;