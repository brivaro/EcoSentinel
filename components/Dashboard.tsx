
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDevice } from '../context/DeviceContext';
import { calculateDewPoint, calculateHeatIndex, getComfortStatus } from '../utils/physics';
import { fetchExternalWeather, WeatherData, getWmoDescription } from '../services/weatherService';
import { getSmartInsight } from '../utils/insights';
import { useTelegramBot } from '../telegram/useTelegramBot';
import StatCard from './StatCard';
import Sidebar from './Sidebar';
import AiChatModal from './AiChatModal';

const Dashboard: React.FC = () => {
  const { state, mqttStatus, fanStatus } = useDevice();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    fetchExternalWeather().then(setWeather);
    const interval = setInterval(() => fetchExternalWeather().then(setWeather), 600000); // 10 mins
    return () => clearInterval(interval);
  }, []);

  // Initialize Telegram Bot Hook (Runs in background while Dashboard is open)
  useTelegramBot({ deviceState: state, externalWeather: weather });

  // Derived Metrics
  const temp = state.temperature || 0;
  const hum = state.humidity || 0;
  const dewPoint = calculateDewPoint(temp, hum);
  const heatIndex = calculateHeatIndex(temp, hum);
  const comfort = getComfortStatus(temp, heatIndex, dewPoint);

  // External Weather Derivations
  const weatherInfo = weather ? getWmoDescription(weather.weatherCode) : { text: '--', icon: '' };

  // Smart Insight Logic (Now using shared utility)
  const insight = getSmartInsight(temp, hum, dewPoint, heatIndex, weather);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Top Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Eco<span className="text-brand-600">Sentinel</span></h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* MQTT Status Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                mqttStatus === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : 
                mqttStatus === 'reconnecting' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                'bg-red-50 text-red-700 border-red-200'
            }`}>
                <div className={`w-2 h-2 rounded-full ${mqttStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span>{mqttStatus}</span>
            </div>

            <button 
              onClick={() => setChatOpen(true)}
              className="bg-brand-100 text-brand-700 p-2 rounded-lg hover:bg-brand-200 transition relative"
            >
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">AI</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </button>

            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-slate-500 hover:text-brand-600 transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Smart Insight Banner */}
        <div className="mb-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between">
          <div>
             <h2 className="text-sm font-bold text-brand-400 uppercase tracking-wider mb-1">Eco Insight System</h2>
             <p className="text-lg font-medium">{insight}</p>
          </div>
          {fanStatus && (
             <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                 <div className="w-5 h-5 animate-spin">⚙️</div>
                 <span className="text-sm font-bold text-brand-300">AUTO-FAN ENGAGED</span>
             </div>
          )}
        </div>

        {/* Internal Stats Grid */}
        <div className="flex items-center space-x-2 mb-6">
             <span className="text-2xl animate-bounce">🏠</span>
             <div>
                <h2 className="text-lg font-bold text-slate-800">Dispositivo Interior</h2>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Monitorización Local</p>
             </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            label="Temperature" 
            value={temp} 
            unit="°C" 
            icon={<span>🌡</span>} 
            colorClass="bg-orange-500 text-orange-600" 
            subtext={comfort}
          />
          <StatCard 
            label="Humidity" 
            value={hum} 
            unit="%" 
            icon={<span>💧</span>} 
            colorClass="bg-blue-500 text-blue-600" 
          />
          <StatCard 
            label="Dew Point" 
            value={dewPoint} 
            unit="°C" 
            icon={<span>🌫</span>} 
            colorClass="bg-indigo-500 text-indigo-600" 
            subtext={dewPoint > 20 ? 'Critical High' : 'Normal'}
          />
          <StatCard 
            label="Heat Index" 
            value={heatIndex} 
            unit="°C" 
            icon={<span>☀️</span>} 
            colorClass="bg-red-500 text-red-600" 
            subtext={`Feels like ${heatIndex}°C`}
          />
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Live Environmental Trends</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={state.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  labelStyle={{ color: '#64748b' }}
                />
                <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} dot={false} name="Temp (°C)" />
                <Line type="monotone" dataKey="hum" stroke="#3b82f6" strokeWidth={3} dot={false} name="Hum (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* External Weather Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
             <span className="text-2xl animate-bounce">📍</span>
             <div>
                <h3 className="text-lg font-bold text-slate-800">Valencia, ES</h3>
                <p className="text-xs text-slate-500 font-medium">DATOS EXTERNOS EN TIEMPO REAL</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
                label="Temperatura Exterior" 
                value={weather?.temperature ?? '--'} 
                unit="°C" 
                icon={<span>🌍</span>} 
                colorClass="bg-cyan-500 text-cyan-600"
                subtext="Open-Meteo API"
            />
            <StatCard 
                label="Condición" 
                value={weatherInfo.text}
                unit="" 
                icon={<span>{weatherInfo.icon || '🌤'}</span>} 
                colorClass="bg-sky-500 text-sky-600"
                subtext="Actual"
            />
             <StatCard 
                label="Viento" 
                value={weather?.windSpeed ?? '--'} 
                unit="km/h" 
                icon={<span>💨</span>} 
                colorClass="bg-teal-500 text-teal-600"
                subtext="Velocidad"
            />
          </div>
        </div>

      </main>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AiChatModal isOpen={isChatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default Dashboard;
