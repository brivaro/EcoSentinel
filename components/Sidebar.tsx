import React from 'react';
import { useDevice } from '../context/DeviceContext';
import { formatLastSeen } from '../utils/formatters';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { state } = useDevice();
  const { battery, wifi, sys } = state;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" 
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-slate-900 text-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-500 tracking-tight">Technical Data</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto h-[calc(100%-80px)]">
          
          {/* Battery Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Power System</h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Voltage</span>
                <span className="font-mono">{battery?.voltage.toFixed(1) || '--'} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Level</span>
                <span className={`font-mono font-bold ${battery && battery.percent < 20 ? 'text-red-500' : 'text-brand-400'}`}>
                  {battery?.percent || '--'}%
                </span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full mt-2">
                <div 
                  className="bg-brand-500 h-2 rounded-full transition-all" 
                  style={{ width: `${battery?.percent || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Network Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Connectivity</h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">IP Address</span>
                <span className="font-mono text-sm">{wifi?.ip || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">SSID</span>
                <span className="font-mono text-sm">{wifi?.ssid || '--'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Signal (RSSI)</span>
                <span className={`font-mono text-sm ${wifi && wifi.rssi < -80 ? 'text-red-400' : 'text-green-400'}`}>
                  {wifi?.rssi || '--'} dBm
                </span>
              </div>
            </div>
          </div>

          {/* System Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Device Info</h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">MAC</span>
                <span className="font-mono text-xs text-slate-300">{sys?.mac || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Firmware</span>
                <span className="font-mono text-xs text-slate-300">{sys?.firmwareVersion || 'Unknown'}</span>
              </div>
               <div className="flex justify-between">
                <span className="text-slate-400">Last Sync</span>
                <span className="font-mono text-xs text-slate-300">{formatLastSeen(state.lastUpdated)}</span>
              </div>
              {sys?.updateAvailable && (
                <div className="mt-2 bg-yellow-500/20 text-yellow-400 px-3 py-2 rounded text-xs text-center border border-yellow-500/50">
                  ⚠ Firmware Update Available
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Sidebar;