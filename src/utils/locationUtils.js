export const fetchCityName = async () => {
  try {
    const response = await fetch('http://ip-api.com/json/');
    const data = await response.json();
    if (data.status === 'success') {
      return data.city;
    }
  } catch (error) {
    console.error('Error fetching location:', error);
  }
  return null;
};