import { LOCATION_CONFIG } from '../constants';

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
}

export const getWmoDescription = (code: number): { text: string; icon: string } => {
  // WMO Weather interpretation codes (Open-Meteo)
  if (code === 0) return { text: 'Despejado', icon: '☀️' };
  if (code >= 1 && code <= 3) return { text: 'Nublado', icon: '☁️' };
  if (code >= 45 && code <= 48) return { text: 'Niebla', icon: '🌫' };
  if (code >= 51 && code <= 55) return { text: 'Llovizna', icon: '🌦' };
  if (code >= 61 && code <= 67) return { text: 'Lluvia', icon: '🌧' };
  if (code >= 71 && code <= 77) return { text: 'Nieve', icon: '❄️' };
  if (code >= 80 && code <= 82) return { text: 'Chubascos', icon: '🌦' };
  if (code >= 95) return { text: 'Tormenta', icon: '⛈' };
  return { text: 'Desconocido', icon: '❓' };
};

export const fetchExternalWeather = async (): Promise<WeatherData | null> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION_CONFIG.LAT}&longitude=${LOCATION_CONFIG.LON}&current_weather=true`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.current_weather) return null;

    return {
      temperature: data.current_weather.temperature,
      weatherCode: data.current_weather.weathercode,
      windSpeed: data.current_weather.windspeed
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return null;
  }
};