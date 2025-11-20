export interface ShellyBattery {
  V: number;
  percent: number;
}

export interface ShellyExternalPower {
  present: boolean;
}

export interface ShellyPowerData {
  battery?: ShellyBattery;
  external?: ShellyExternalPower;
}

export interface ShellyHumidity {
  rh: number;
}

export interface ShellyTemperature {
  tC: number;
  tF: number;
}

export interface ShellyWifi {
  sta_ip?: string;
  ssid?: string;
  rssi?: number;
}

export interface ShellySys {
  mac?: string;
  uptime?: number;
  available_updates?: {
    stable?: { version: string };
    beta?: { version: string };
  };
}

// The flattened, normalized state for our App
export interface DeviceState {
  lastUpdated: number;
  isConnected: boolean;
  temperature: number | null;
  humidity: number | null;
  battery: {
    voltage: number;
    percent: number;
  } | null;
  wifi: {
    ip: string;
    ssid: string;
    rssi: number;
  } | null;
  sys: {
    mac: string;
    updateAvailable: boolean;
    firmwareVersion?: string;
  } | null;
  history: Array<{ time: string; temp: number; hum: number }>;
}

// Physics results
export interface EnvironmentalMetrics {
  dewPoint: number | null;
  heatIndex: number | null;
  comfortStatus: string;
}

// RPC Payload Structure
export interface RpcPayload {
  method: string;
  params: {
    ts: number;
    "devicepower:0"?: ShellyPowerData;
    "humidity:0"?: ShellyHumidity;
    "temperature:0"?: ShellyTemperature;
    wifi?: ShellyWifi;
    sys?: ShellySys;
  };
}
