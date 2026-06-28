import React, { useState, useEffect } from 'react';
import { Activity, Download } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import ISROGlobe from './components/ISROGlobe';
import ForecastPanel from './components/ForecastPanel';
import SatelliteMatrix from './components/SatelliteMatrix';
import SolarChatbot from './components/SolarChatbot';
import NavICImpact from './components/NavICImpact';
import TelemetryGauges from './components/TelemetryGauges';
import HaloCmeDetector from './components/HaloCmeDetector';
import AlertBanner from './components/AlertBanner';
import TickerTape from './components/TickerTape';
import CountdownTimers from './components/CountdownTimers';
import { useAlertState } from './hooks/useAlertState';

import './App.css';

function App() {
  const [currentFlux, setCurrentFlux] = useState<any>(null);
  const [fluxHistory, setFluxHistory] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

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
        console.error('Error fetching solar data:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  const flareClass = currentFlux?.noaa_class?.[0] || 'A';
  const fluxValue = currentFlux?.flux || 1e-8;
  const alertState = useAlertState(flareClass, fluxValue);

  // Red Alert Siren & Voice (Web Audio API + Speech)
  useEffect(() => {
    if (alertState.level === 'ALERT') {
      if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance(`WARNING. Critical ${flareClass}-class solar event detected. Mitigation protocol initiated.`);
        msg.rate = 0.9;
        msg.pitch = 0.8;
        window.speechSynthesis.speak(msg);
      }

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      };

      playBeep();
      const interval = setInterval(playBeep, 1000);

      return () => {
        clearInterval(interval);
        audioCtx.close().catch(console.error);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [alertState.level, flareClass]);

  const forecastData = forecast ? Array.from({ length: 6 }, (_, i) => {
    const time = new Date();
    time.setHours(time.getHours() + i + 1);
    const prob = forecast.probability || 0;
    const predicted_flux = fluxValue * (1 + Math.sin((i / 5) * Math.PI) * prob * 10);
    return {
      time: time.toISOString(),
      predicted_flux,
      upper_bound: predicted_flux * 2,
      lower_bound: predicted_flux * 0.5
    };
  }) : [];

  const historyData = fluxHistory.map(h => ({
    time: h.time,
    actual_flux: h.flux
  }));

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/advisory-report`, { current_flux: currentFlux });
      const text = res.data.advisory || 'No advisory generated.';
      const doc = new jsPDF();
      doc.setFillColor(10, 10, 20);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 165, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('VyomOS — Space Weather Advisory', 20, 15);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST  |  BAH 2026 Submission`, 20, 23);
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(text, 170);
      doc.text(splitText, 20, 40);
      doc.save('VyomOS-SpaceWeather-Advisory.pdf');
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Failed to generate PDF. Check backend connection.');
    }
    setGeneratingPdf(false);
  };

  const istTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });

  return (
    <SkeletonTheme baseColor="#1e293b" highlightColor="#334155">
      <div className="min-h-screen bg-[#040a14] text-slate-200 font-sans relative flex flex-col">
        
        {/* Red Alert Overlay */}
        {alertState.level === 'ALERT' && (
          <div className="absolute inset-0 pointer-events-none z-50 animate-pulse shadow-[inset_0_0_150px_rgba(239,68,68,0.3)]"></div>
        )}

        <TickerTape currentFlux={currentFlux} forecast={forecast} flareClass={flareClass} />

        <div className="p-4 flex flex-col flex-grow relative z-10">
          <AlertBanner
            level={alertState.level}
            message={alertState.message}
            color={alertState.color}
            bgColor={alertState.bgColor}
            since={alertState.since}
          />

          <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.6)]">
                <Activity className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">VyomOS</h1>
                <p className="text-xs text-orange-400 uppercase tracking-widest font-semibold">Aditya-L1 Space Command</p>
              </div>
            </div>

            <div className="flex gap-6 items-center">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Live X-Ray Flux</div>
                <div className="text-xl font-mono text-white">
                  {currentFlux ? currentFlux.flux_scientific : <Skeleton width={80} />} <span className="text-xs text-slate-500">W/m²</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">IST</div>
                <div className="text-lg font-mono text-slate-300">{istTime}</div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700/60">
                <div className={`w-2 h-2 rounded-full animate-pulse ${alertState.level === 'NORMAL' ? 'bg-emerald-500' : alertState.level === 'ALERT' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                <span className="text-sm font-medium text-slate-300">GOES/Aditya-L1</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow">
            <div className="lg:col-span-4 flex flex-col gap-4">
              {currentFlux ? (
                <>
                  <SatelliteMatrix flareClass={flareClass} fluxValue={fluxValue} alertLevel={alertState.level} />
                  <HaloCmeDetector />
                  <TelemetryGauges satelliteName="Aditya-L1" isAlert={alertState.level === 'ALERT'} />
                  <NavICImpact flareClass={flareClass} fluxValue={fluxValue} />
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <Skeleton height={200} borderRadius="0.75rem" />
                  <Skeleton height={150} borderRadius="0.75rem" />
                </div>
              )}
              <CountdownTimers />
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Space Weather Advisory</h3>
                <p className="text-xs text-slate-400 mb-4">Autonomous advisory by Gemini 3.5 Flash + RAG context.</p>
                <button
                  onClick={handleGeneratePdf}
                  disabled={generatingPdf || !currentFlux}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium py-2 rounded transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                >
                  {generatingPdf ? 'Generating...' : (<><Download className="w-4 h-4" /> Generate Advisory PDF</>)}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 rounded-xl overflow-hidden shadow-2xl relative h-[420px] lg:h-auto border border-gray-700/60">
              {currentFlux ? (
                <ISROGlobe flareClass={flareClass} />
              ) : (
                <Skeleton height="100%" borderRadius="0.75rem" />
              )}
            </div>

            <div className="lg:col-span-12 mt-2">
              {forecast ? (
                <ForecastPanel
                  probability={forecast.probability ? forecast.probability * 100 : 0}
                  historyData={historyData}
                  forecastData={forecastData}
                  peakTime={forecastData.length > 0 ? forecastData[2].time : undefined}
                />
              ) : (
                <Skeleton height={250} borderRadius="0.75rem" />
              )}
            </div>
          </div>
        </div>

        <SolarChatbot currentFluxContext={currentFlux} />
      </div>
    </SkeletonTheme>
  );
}

export default App;
