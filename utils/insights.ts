
import { WeatherData } from "../services/weatherService";

export const getSmartInsight = (
  internalTemp: number,
  internalHum: number,
  dewPoint: number,
  heatIndex: number,
  externalWeather: WeatherData | null
): string => {
  if (!externalWeather) return "Analizando datos meteorológicos...";
  
  const extTemp = externalWeather.temperature;

  if (internalTemp > 24 && extTemp < 20) {
    return "❄️ ¡Abre ventanas! Refrigeración natural disponible. El exterior está más fresco que el interior.";
  }
  
  if (internalHum > 65 || dewPoint > 20) {
    return "🍄 ALERTA CRÍTICA: Riesgo alto de moho. La humedad es peligrosa. Ventilar inmediatamente.";
  }
  
  if (heatIndex > internalTemp + 3) {
    return "🥵 Sensación de bochorno activa. Considera activar ventilación forzada.";
  }

  if (internalTemp < 18) {
    return "🥶 Temperatura baja en interior. Comprobar aislamiento térmico.";
  }
  
  return "✅ Condiciones ambientales estables y confortables.";
};
