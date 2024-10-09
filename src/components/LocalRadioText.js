import React, { useState, useEffect } from 'react';
import { fetchCityName } from '../utils/locationUtils';

const US_CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'San Francisco', 'Charlotte', 'Indianapolis',
  'Seattle', 'Denver', 'Washington', 'Boston', 'Nashville', 'El Paso',
  'Detroit', 'Memphis', 'Portland', 'Oklahoma City', 'Las Vegas', 'Louisville'
];

const LocalRadioText = () => {
  const [cityName, setCityName] = useState('');

  useEffect(() => {
    let intervalId;
    
    const fetchRealCityName = async () => {
      const realCityName = await fetchCityName();
      if (realCityName) {
        setCityName(realCityName);
        clearInterval(intervalId);
      }
    };

    const getRandomCity = () => {
      const randomIndex = Math.floor(Math.random() * US_CITIES.length);
      setCityName(US_CITIES[randomIndex]);
    };

    getRandomCity(); // Set initial random city
    intervalId = setInterval(getRandomCity, 1); // Change city every 150ms

    fetchRealCityName();

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="text-xl font-bold mb-4">
      Local {cityName} Radio
    </div>
  );
};

export default LocalRadioText;