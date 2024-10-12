export const fetchCityName = async () => {
  try {
    const response = await fetch('http://ip-api.com/json/');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status === 'success') {
      return data.city;
    } else {
      console.error('API returned unsuccessful status:', data.status, data.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
};