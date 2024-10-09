export const fetchCityName = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.city || 'Unknown City';
  } catch (error) {
    console.error('Error fetching location:', error);
    return 'Unknown City';
  }
};