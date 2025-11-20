
import { TELEGRAM_CONFIG } from '../constants';
import { TelegramResponse, TelegramUpdate, TelegramMessage } from './types';

const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}`;

export const telegramService = {
  /**
   * Sends a text message to a specific chat
   */
  sendMessage: async (chatId: number | string, text: string): Promise<TelegramMessage | null> => {
    if (!TELEGRAM_CONFIG.BOT_TOKEN || TELEGRAM_CONFIG.BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
      console.warn("Telegram Bot Token not configured.");
      return null;
    }

    try {
      const response = await fetch(`${BASE_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
      
      const data: TelegramResponse<TelegramMessage> = await response.json();
      if (!data.ok) {
        console.error('Telegram API Error:', data);
        return null;
      }
      return data.result;
    } catch (error) {
      console.error('Network Error sending Telegram message:', error);
      return null;
    }
  },

  /**
   * Polls for new updates (messages) from the server
   */
  getUpdates: async (offset: number): Promise<TelegramUpdate[]> => {
    if (!TELEGRAM_CONFIG.BOT_TOKEN || TELEGRAM_CONFIG.BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') return [];

    try {
      const response = await fetch(`${BASE_URL}/getUpdates?offset=${offset}&limit=10&timeout=0`);
      const data: TelegramResponse<TelegramUpdate[]> = await response.json();
      
      if (data.ok) {
        return data.result;
      }
      return [];
    } catch (error) {
      // Silent fail on network error to avoid console spam during polling
      return [];
    }
  }
};
