import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import axios from 'axios';

import ISROGlobe from './components/ISROGlobe';
import ForecastPanel from './components/ForecastPanel';
import SatelliteMatrix from './components/SatelliteMatrix';
import SolarChatbot from './components/SolarChatbot';

import './App.css';

function App() {
  const [currentFlux, setCurrentFlux] = useState<any>(null);
  const [fluxHistory, setFluxHistory] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currRes, histRes, foreRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/current-flux`),
          axios.get(`${API_BASE_URL}/api/flux-history`),
          axios.get(`${API_BASE_URL}/api/forecast`)
        ]);
        setCurrentFlux(currRes.data);
        setFluxHistory(histRes.data);
        setForecast(foreRes.data);
      } catch (err) {
        console.error("Error fetching solar data:", err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  const flareClass = currentFlux?.noaa_class || 'A';
  const alertLevel = currentFlux?.alert_level || 'NORMAL';
  const isHighAlert = flareClass === 'M' || flareClass === 'X';

  const forecastData = forecast ? Array.from({length: 6}, (_, i) => {
    const time = new Date();
    time.setHours(time.getHours() + i + 1);
    const prob = forecast.probability || 0;
    const baseFlux = currentFlux ? currentFlux.flux : 1e-8;
    const peakMulti = prob * 10;
    const predicted_flux = baseFlux * (1 + Math.sin((i/5) * Math.PI) * peakMulti);
    
    return {
      time: time.toISOString(),
      predicted_flux: predicted_flux,
      upper_bound: predicted_flux * 2,
      lower_bound: predicted_flux * 0.5
    };
  }) : [];

  const historyData = fluxHistory.map(h => ({
    time: h.time,
    actual_flux: h.flux
  }));

  useEffect(() => {
    if (isHighAlert) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
        console.error("Audio playback blocked", e);
      }
    }
  }, [isHighAlert]);

  return (
    <div className="min-h-screen bg-black text-slate-200 p-4 font-sans relative flex flex-col">
      {isHighAlert && (
        <div className="w-full bg-red-600 text-white font-bold text-center py-2 animate-pulse flex justify-center items-center gap-2 mb-4 rounded-lg">
          <ShieldAlert className="w-5 h-5" />
          SOLAR FLARE ALERT: {flareClass}-Class Event Detected. ISRO Satellites at Risk.
        </div>
      )}

      <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(234,88,12,0.5)]">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">VyomOS</h1>
            <p className="text-xs text-orange-400 uppercase tracking-widest font-semibold">Aditya-L1 Command Center</p>
          </div>
        </div>
        
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase">Live X-Ray Flux</div>
            <div className="text-xl font-mono text-white">
              {currentFlux?.flux_scientific || '---'} W/m²
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isHighAlert ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            <span className="text-sm font-medium text-slate-300">GOES/Aditya-L1 Feed</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow">
        <div className="lg:col-span-4 flex flex-col gap-4">
          <SatelliteMatrix 
            flareClass={flareClass} 
            fluxValue={currentFlux?.flux || 0}
            alertLevel={alertLevel}
          />
          <div className="bg-gray-900 bg-opacity-50 backdrop-blur-lg border border-gray-700 rounded-xl p-4 shadow-xl mt-auto">
             <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Space Weather Advisory</h3>
             <p className="text-xs text-slate-400 mb-4">Autonomous advisory generation driven by Gemini 1.5 Flash and RAG context.</p>
             <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
               Generate Advisory PDF
             </button>
          </div>
        </div>

        <div className="lg:col-span-8 rounded-xl overflow-hidden shadow-2xl relative h-[400px] lg:h-auto border border-gray-700">
          <ISROGlobe flareClass={flareClass} />
        </div>

        <div className="lg:col-span-12 mt-2">
          <ForecastPanel 
            probability={forecast?.probability ? forecast.probability * 100 : 0} 
            historyData={historyData}
            forecastData={forecastData}
            peakTime={forecastData.length > 0 ? forecastData[2].time : undefined}
          />
        </div>
      </div>

      <SolarChatbot currentFluxContext={currentFlux} />
    </div>
  );
}

export default App;
