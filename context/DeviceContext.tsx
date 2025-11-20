import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { mqttService } from '../services/mqttService';
import { DeviceState, RpcPayload } from '../types';
import { MQTT_CONFIG } from '../constants';

interface DeviceContextProps {
  state: DeviceState;
  mqttStatus: 'connected' | 'disconnected' | 'reconnecting';
  fanStatus: boolean;
}

const initialDeviceState: DeviceState = {
  lastUpdated: 0,
  isConnected: false,
  temperature: null,
  humidity: null,
  battery: null,
  wifi: null,
  sys: null,
  history: [],
};

const DeviceContext = createContext<DeviceContextProps>({
  state: initialDeviceState,
  mqttStatus: 'disconnected',
  fanStatus: false,
});

export const useDevice = () => useContext(DeviceContext);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DeviceState>(initialDeviceState);
  const [mqttStatus, setMqttStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [fanStatus, setFanStatus] = useState(false);

  const handleRpcMessage = useCallback((payload: RpcPayload) => {
    setState((prev) => {
      const { params, method } = payload;
      
      // Base new state on previous
      const newState: DeviceState = { ...prev, lastUpdated: params.ts || Date.now() / 1000 };

      // Helper to update history
      const updateHistory = (temp: number, hum: number) => {
         const point = {
             time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
             temp,
             hum
         };
         // Keep last 20 points
         return [...prev.history, point].slice(-20);
      };

      if (method === 'NotifyFullStatus') {
        // Hydrate everything available
        if (params["temperature:0"]) newState.temperature = params["temperature:0"].tC;
        if (params["humidity:0"]) newState.humidity = params["humidity:0"].rh;
        
        if (params["devicepower:0"] && params["devicepower:0"].battery) {
          newState.battery = {
            voltage: params["devicepower:0"].battery.V,
            percent: params["devicepower:0"].battery.percent,
          };
        }
        
        if (params.wifi) {
          newState.wifi = {
            ip: params.wifi.sta_ip || prev.wifi?.ip || '',
            ssid: params.wifi.ssid || prev.wifi?.ssid || '',
            rssi: params.wifi.rssi || prev.wifi?.rssi || 0,
          };
        }

        if (params.sys) {
            newState.sys = {
                mac: params.sys.mac || prev.sys?.mac || '',
                updateAvailable: !!params.sys.available_updates && Object.keys(params.sys.available_updates).length > 0,
                firmwareVersion: params.sys.available_updates?.stable?.version || prev.sys?.firmwareVersion
            }
        }
        
        newState.isConnected = true;
        
        if (newState.temperature !== null && newState.humidity !== null) {
            newState.history = updateHistory(newState.temperature, newState.humidity);
        }

      } else if (method === 'NotifyStatus') {
        // Partial Merge logic
        if (params["temperature:0"]) {
            newState.temperature = params["temperature:0"].tC;
        }
        if (params["humidity:0"]) {
            newState.humidity = params["humidity:0"].rh;
        }
        
        // Update history if temp/hum changed
        if (params["temperature:0"] || params["humidity:0"]) {
             const t = newState.temperature ?? 0;
             const h = newState.humidity ?? 0;
             newState.history = updateHistory(t, h);
        }

        if (params["devicepower:0"]?.battery) {
           newState.battery = {
               voltage: params["devicepower:0"].battery.V,
               percent: params["devicepower:0"].battery.percent
           };
        }

        if (params.wifi) {
           newState.wifi = {
               ...prev.wifi!,
               ...params.wifi
           };
        }
        
        if (params.sys) {
            newState.sys = {
                ...prev.sys!,
                ...params.sys,
                updateAvailable: params.sys.available_updates ? Object.keys(params.sys.available_updates).length > 0 : prev.sys?.updateAvailable ?? false
            }
        }
      }

      return newState;
    });
  }, []);

  useEffect(() => {
    mqttService.connect(setMqttStatus);

    mqttService.onMessage((topic, payload) => {
      if (topic === MQTT_CONFIG.TOPIC_RPC) {
        handleRpcMessage(payload as RpcPayload);
      } else if (topic === MQTT_CONFIG.TOPIC_VIRTUAL_FAN) {
        // Handle M2M Loopback visualization
        if (payload && typeof payload.isOn === 'boolean') {
            setFanStatus(payload.isOn);
        }
      }
    });

    return () => mqttService.disconnect();
  }, [handleRpcMessage]);

  // M2M Logic: Auto Fan
  useEffect(() => {
      if (state.temperature && state.temperature > 26 && !fanStatus) {
          console.log("M2M Trigger: High Temp detected. Turning on Virtual Fan.");
          mqttService.publish(MQTT_CONFIG.TOPIC_VIRTUAL_FAN, { isOn: true });
      } else if (state.temperature && state.temperature <= 26 && fanStatus) {
          mqttService.publish(MQTT_CONFIG.TOPIC_VIRTUAL_FAN, { isOn: false });
      }
  }, [state.temperature, fanStatus]);

  return (
    <DeviceContext.Provider value={{ state, mqttStatus, fanStatus }}>
      {children}
    </DeviceContext.Provider>
  );
};