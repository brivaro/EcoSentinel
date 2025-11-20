import React from 'react';
import { DeviceProvider } from './context/DeviceContext';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <DeviceProvider>
        <Dashboard />
    </DeviceProvider>
  );
}

export default App;