import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';
import { MQTT_CONFIG } from '../constants';

type MessageHandler = (topic: string, payload: any) => void;

class MqttService {
  private client: MqttClient | null = null;
  private callbacks: MessageHandler[] = [];

  connect(onStatusChange: (status: 'connected' | 'disconnected' | 'reconnecting') => void) {
    if (this.client) return;

    try {
      // In browser environments via CDN, 'connect' is usually on the default export
      // @ts-ignore
      const connectFn = mqtt.connect || mqtt.default?.connect;

      if (typeof connectFn !== 'function') {
        console.error("MQTT connect function not found. Library export structure:", mqtt);
        return;
      }

      // @ts-ignore - Handling potential type mismatch in different environments
      this.client = connectFn(MQTT_CONFIG.BROKER_URL, {
        keepalive: 60,
        reconnectPeriod: 5000,
        protocolVersion: 4 
      });

      if (this.client) {
        this.client.on('connect', () => {
          console.log('MQTT Connected');
          onStatusChange('connected');
          this.subscribe(MQTT_CONFIG.TOPIC_RPC);
          this.subscribe(MQTT_CONFIG.TOPIC_VIRTUAL_FAN);
        });

        this.client.on('reconnect', () => {
          console.log('MQTT Reconnecting...');
          onStatusChange('reconnecting');
        });

        this.client.on('close', () => {
          console.log('MQTT Disconnected');
          onStatusChange('disconnected');
        });

        this.client.on('error', (err: any) => {
          console.error('MQTT Error', err);
        });

        this.client.on('message', (topic: string, message: any) => {
          try {
            const payload = JSON.parse(message.toString());
            this.callbacks.forEach(cb => cb(topic, payload));
          } catch (e) {
            console.error('Failed to parse MQTT message', e);
          }
        });
      }
    } catch (error) {
      console.error("Failed to initialize MQTT client:", error);
    }
  }

  subscribe(topic: string) {
    if (this.client) {
      this.client.subscribe(topic, (err: any) => {
        if (err) console.error(`Subscribe error: ${topic}`, err);
      });
    }
  }

  publish(topic: string, message: object) {
    if (this.client && this.client.connected) {
      this.client.publish(topic, JSON.stringify(message));
    }
  }

  onMessage(callback: MessageHandler) {
    this.callbacks.push(callback);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

export const mqttService = new MqttService();