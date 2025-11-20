
export const MQTT_CONFIG = {
  BROKER_URL: 'wss://test.mosquitto.org:8081',
  // Using a wildcard for the device ID in a real app, but using the specific one from prompt here
  DEVICE_ID: 'shellyplusht-08b61fcb8dbc',
  TOPIC_RPC: 'upvina/shellyplusht-08b61fcb8dbc/events/rpc',
  TOPIC_VIRTUAL_FAN: 'upvina/shellyplusht-08b61fcb8dbc/virtual/fan',
};

export const LOCATION_CONFIG = {
  LAT: 39.4699,
  LON: -0.3763, // Valencia
};

export const TELEGRAM_CONFIG = {
  // REPLACE THIS WITH YOUR BOT TOKEN FROM @BotFather
  BOT_TOKEN: '8597878490:AAFvLcOilNm8MNcdFvFpr381dTUy3zUKdtc', 
  // REPLACE THIS WITH YOUR CHAT ID (obtained via @userinfobot or via logs)
  // Allows the bot to send proactive alerts
  TARGET_CHAT_ID: '317070288', 
  POLLING_INTERVAL_MS: 3000, // Check for messages every 3 seconds
};

export const KNOWLEDGE_BASE = {
  reset: "Mantener botón presionado 10s para Factory Reset.",
  led_modes: "Flash lento: AP Mode. Flash rápido: Conectando. Fijo: Conectado.",
  ranges: {
    temp: "-10°C to 60°C",
    humidity: "0% to 100%"
  }
};
