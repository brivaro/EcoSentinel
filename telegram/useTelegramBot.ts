import { useEffect, useRef, useState } from 'react';
import { telegramService } from './telegramService';
import { DeviceState } from '../types';
import { WeatherData, getWmoDescription } from '../services/weatherService';
import { getSmartInsight } from '../utils/insights';
import { calculateDewPoint, calculateHeatIndex } from '../utils/physics';
import { TELEGRAM_CONFIG } from '../constants';

interface UseTelegramBotProps {
  deviceState: DeviceState;
  externalWeather: WeatherData | null;
}

export const useTelegramBot = ({ deviceState, externalWeather }: UseTelegramBotProps) => {
  const [lastUpdateId, setLastUpdateId] = useState(0);
  
  // Refs for state tracking to prevent duplicate alerts and manage reminders
  const lastSentInsightRef = useRef<string>('');
  const lastNotificationTimeRef = useRef<number>(0);
  const isFirstRunRef = useRef<boolean>(true);

  // Command Logic
  const handleCommand = async (chatId: number, text: string) => {
    const command = text.toLowerCase().trim();
    
    const t = deviceState.temperature || 0;
    const h = deviceState.humidity || 0;
    const bat = deviceState.battery?.percent || 0;
    const volt = deviceState.battery?.voltage || 0;
    const rssi = deviceState.wifi?.rssi || 0;
    const dp = calculateDewPoint(t, h);
    const hi = calculateHeatIndex(t, h);
    const insight = getSmartInsight(t, h, dp, hi, externalWeather);

    let response = "";

    switch (command) {
      case '/start':
        response = `🤖 *EcoSentinel Bot Online*\n\n` +
                   `Comandos disponibles:\n` +
                   `🌡 */status* - Informe completo de sensores\n` +
                   `🧠 */insight* - Recomendaciones inteligentes\n` +
                   `🌍 */weather* - Clima exterior (Valencia)\n` +
                   `🔋 */battery* - Estado de energía\n\n` +
                   `_🔔 Monitorización activa: Te notificaré cambios de estado y alertas._`;
        break;

      case '/status':
        response = `📊 *Informe de Estado*\n\n` +
                   `🌡 *Temperatura:* ${t.toFixed(1)}°C\n` +
                   `🔥 *Sensación Térmica:* ${hi.toFixed(1)}°C\n` +
                   `💧 *Humedad:* ${h.toFixed(0)}%\n` +
                   `🌫 *Punto de Rocío:* ${dp.toFixed(1)}°C\n` +
                   `-------------------\n` +
                   `🔋 *Batería:* ${bat}% (${volt}V)\n` +
                   `📡 *Señal WiFi:* ${rssi} dBm\n`;
        break;

      case '/insight':
        response = `🧠 *Análisis EcoSentinel*\n\n${insight}`;
        break;

      case '/battery':
        response = `🔋 *Estado de Energía*\n\n` +
                   `Nivel: *${bat}%*\n` +
                   `Voltaje: *${volt}V*\n` +
                   `Estado: ${bat < 20 ? '⚠️ Recargar pronto' : '✅ Óptimo'}`;
        break;
      
      case '/weather':
        if (externalWeather) {
            const w = getWmoDescription(externalWeather.weatherCode);
            response = `🌍 *Clima Exterior (Valencia)*\n\n` +
                       `🌤 *Condición:* ${w.text} ${w.icon}\n` +
                       `🌡 *Temperatura:* ${externalWeather.temperature}°C\n` +
                       `💨 *Viento:* ${externalWeather.windSpeed} km/h`;
        } else {
            response = "⏳ Obteniendo datos meteorológicos actualizados...";
        }
        break;

      default:
        response = "❌ Comando desconocido. Prueba /start";
    }

    await telegramService.sendMessage(chatId, response);
  };

  // 1. POLLING LOOP (Check for incoming messages)
  useEffect(() => {
    const poll = async () => {
      const updates = await telegramService.getUpdates(lastUpdateId + 1);
      
      if (updates.length > 0) {
        const maxId = Math.max(...updates.map(u => u.update_id));
        setLastUpdateId(maxId);

        for (const update of updates) {
          if (update.message && update.message.text) {
            await handleCommand(update.message.chat.id, update.message.text);
          }
        }
      }
    };

    const interval = setInterval(poll, TELEGRAM_CONFIG.POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [lastUpdateId, deviceState, externalWeather]);


  // 2. NOTIFICATION LOGIC (Push alerts based on state changes)
  useEffect(() => {
    const checkAlerts = async () => {
      // Basic requirements
      if (!TELEGRAM_CONFIG.TARGET_CHAT_ID || !externalWeather) return;
      
      const t = deviceState.temperature || 0;
      const h = deviceState.humidity || 0;
      const dp = calculateDewPoint(t, h);
      const hi = calculateHeatIndex(t, h);
      
      const currentInsight = getSmartInsight(t, h, dp, hi, externalWeather);
      
      // Filter out initialization states ("Analizando...")
      if (currentInsight.includes("Analizando")) return;

      const now = Date.now();
      const isStable = currentInsight.includes('✅'); // Assumes green check means stable
      const hasChanged = currentInsight !== lastSentInsightRef.current;
      
      // Reminder cooldown (1 hour) for persistent alerts
      const REMINDER_COOLDOWN = 60 * 60 * 1000; 
      const timeSinceLast = now - lastNotificationTimeRef.current;

      // Handle Initial Run: Sync state but don't spam unless it's critical
      if (isFirstRunRef.current) {
          isFirstRunRef.current = false;
          lastSentInsightRef.current = currentInsight;
          
          // Only notify immediately on boot if we start in a BAD state
          if (!isStable) {
              console.log("[Telegram] Sending Initial Alert");
              await telegramService.sendMessage(
                  TELEGRAM_CONFIG.TARGET_CHAT_ID, 
                  `🚨 *ALERTA INICIAL*\n\n${currentInsight}`
              );
              lastNotificationTimeRef.current = now;
          }
          return;
      }

      // Logic for updates
      if (hasChanged) {
          if (isStable) {
              // RECOVERY: Only send if we were previously NOT stable
              // (Avoids sending "Stable" message if we just booted up stable)
              const wasAlert = !lastSentInsightRef.current.includes('✅') && lastSentInsightRef.current !== '';
              
              if (wasAlert) {
                  console.log("[Telegram] Sending Recovery");
                  await telegramService.sendMessage(
                      TELEGRAM_CONFIG.TARGET_CHAT_ID, 
                      `🟢 *ESTADO NORMALIZADO*\n\nEl ambiente se ha estabilizado:\n"${currentInsight}"`
                  );
                  lastNotificationTimeRef.current = now;
              }
          } else {
              // NEW ALERT (or different alert type)
              console.log("[Telegram] Sending New Alert");
              await telegramService.sendMessage(
                  TELEGRAM_CONFIG.TARGET_CHAT_ID, 
                  `🚨 *CAMBIO DE ESTADO*\n\n${currentInsight}`
              );
              lastNotificationTimeRef.current = now;
          }
          
          // Update tracker
          lastSentInsightRef.current = currentInsight;
      } 
      else {
          // SAME STATE: Check for reminders
          if (!isStable && timeSinceLast > REMINDER_COOLDOWN) {
              console.log("[Telegram] Sending Reminder");
              await telegramService.sendMessage(
                  TELEGRAM_CONFIG.TARGET_CHAT_ID, 
                  `⏰ *RECORDATORIO*\n\nLa alerta persiste:\n${currentInsight}`
              );
              lastNotificationTimeRef.current = now;
          }
      }
    };

    checkAlerts();
  }, [deviceState.lastUpdated, externalWeather]); // Run whenever data refreshes

  return null;
};