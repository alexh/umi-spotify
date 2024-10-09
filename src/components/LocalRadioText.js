import React, { useState, useEffect } from 'react';
import { fetchCityName } from '../utils/locationUtils';

const cities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Boise', 'Fargo', 'Omaha', 'Tulsa', 'Reno',
  'Spokane', 'Bozeman', 'Missoula', 'Duluth', 'Sioux Falls',
  'Asheville', 'Burlington', 'Portland', 'Eugene', 'Bend',
  'Santa Fe', 'Taos', 'Sedona', 'Flagstaff', 'Moab', 'Boulder'
];

const LocalRadioText = () => {
  const [displayCity, setDisplayCity] = useState('');

  useEffect(() => {
    const fetchCity = async () => {
      const city = await fetchCityName();

      let count = 0;
      const interval = setInterval(() => {
        if (count < 20) {
          setDisplayCity(cities[Math.floor(Math.random() * cities.length)]);
          count++;
        } else {
          setDisplayCity(city);
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    };

    fetchCity();
  }, []);

  return (
    <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-4">
      Broadcasting <span className="animate-pulse">LIVE</span> from <span className="font-bold">{displayCity}</span>
    </p>
  );
};

export default LocalRadioText;