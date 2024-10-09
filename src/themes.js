import React from 'react';

export const themes = {
  default: {
    primary: '#FF5F00',
    secondary: '#CC4C19',
    text: '#000000',
    background: '#FFD700',
  },
  monochrome: {
    primary: '#333333',
    secondary: '#666666',
    text: '#FFFFFF',
    background: '#000000',
  },
  cute: {
    primary: '#FF69B4',
    secondary: '#FFB6C1',
    text: '#008db4',
    background: '#FFC0CB',
  },
  night: {
    primary: '#1A1A1A',
    secondary: '#2C2C2C',
    text: '#FF0000',
    background: '#000000',
  },
  forest: {
    primary: '#0f280f',
    secondary: '#b89d54',
    text: '#F0FFF0',
    background: '#013220',
  },
  ocean: {
    primary: '#4169E1',
    secondary: '#1E90FF',
    text: '#F0F8FF',
    background: '#00008B',
  },
  sunset: {
    primary: '#FF4500',
    secondary: '#FF6347',
    text: '#FFD700',
    background: '#4B0082',
  },
  arctic: {
    primary: '#E0FFFF',     // Light cyan
    secondary: '#dbdbdb',   // Azure
    text: '#0000FF',        // Blue text
    background: '#FFFFFF',  // White background
  },
  desert: {
    primary: '#D2691E',     // Chocolate
    secondary: '#DEB887',   // Burlywood
    text: '#8B4513',        // Saddle Brown
    background: '#F4A460',  // Sandy Brown
  },
  neon: {
    primary: '#000000',     // Neon orange
    secondary: '#ff33f8',   // Lighter neon orange
    text: '#00e5ff',        // Neon orange text
    background: '#000000',  // Black background
  },
  cog: {
    primary: '#A9A9A9',     // Dark grey
    secondary: '#D3D3D3',   // Light grey
    text: '#FFA500',        // Orange text
    background: '#696969',  // Dim grey background
  }
};

export const ThemeContext = React.createContext();