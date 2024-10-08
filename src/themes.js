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
    text: '#E6F3FF', // Light blue color
    background: '#FFC0CB',
  },
};

export const ThemeContext = React.createContext();