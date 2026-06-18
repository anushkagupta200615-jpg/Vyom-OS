import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, Satellite, Database, ActivitySquare, Map as MapIcon } from 'lucide-react';
import axios from 'axios';
import Globe from 'react-globe.gl';

const MapVisualization = ({ anomalyData }: { anomalyData: any }) => {
  const globeEl = useRef<any>();
  
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2 }, 4000);
    }
  }, []);

  const ringsData = anomalyData ? [{
    lat: anomalyData.received_data.location.lat,
    lng: anomalyData.received_data.location.lng,
    maxR: anomalyData.received_data.severity * 5,
    propagationSpeed: 1,
    repeatPeriod: 1000
  }] : [];

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-slate-700/50 flex items-center justify-center">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        ringsData={ringsData}
        ringColor={() => '#ef4444'}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
      />
      <div className="absolute bottom-4 left-4 z-10 text-center flex flex-col items-center bg-black/60 p-3 rounded-xl backdrop-blur-sm border border-slate-700/50">
        <MapIcon className="w-6 h-6 text-blue-500/80 mb-1" />
        <h3 className="text-sm font-semibold text-blue-400 tracking-wider uppercase">3D Digital Twin</h3>
      </div>
    </div>
  );
};

function App() {
  const [dashboardStatus, setDashboardStatus] = useState<any>(null);
  const [anomalyData, setAnomalyData] = useState<any>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/dashboard/status`)
      .then(res => setDashboardStatus(res.data))
      .catch(err => console.error("Backend not running yet", err));
  }, []);

  const triggerEdgeSimulation = () => {
    setIsTransmitting(true);
    setErrorMsg(null);
    
    const lats = [28.6139, 40.7128, 51.5074, -33.8688, 35.6895];
    const lngs = [77.2090, -74.0060, -0.1278, 151.2093, 139.6917];
    const randIdx = Math.floor(Math.random() * lats.length);

    const payload = {
      id: `ANOM-${Math.floor(Math.random() * 1000)}`,
      type: "Urban Heat Island Signature",
      location: { lat: lats[randIdx], lng: lngs[randIdx], grid: `GRID-${randIdx}` },
      severity: 0.92,
      confidence: 0.98,
      timestamp: new Date().toISOString()
    };

    axios.post(`${API_BASE_URL}/api/edge/transmit`, payload)
      .then(res => {
        setAnomalyData(res.data);
        setIsTransmitting(false);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg("Connection Refused: The Ground Station AI is likely still booting up and downloading models to the D: drive. Please wait 1-2 minutes and try again.");
        setIsTransmitting(false);
      });
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 p-6 font-sans relative">
      
      {/* Error Toast */}
      {errorMsg && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/90 border border-red-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-sm font-medium">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)} className="ml-4 text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <ActivitySquare className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Vyom OS</h1>
            <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold">Command Center</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium text-slate-300">Space Layer Link: Active</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-xl border border-slate-700/50 shadow-xl relative overflow-hidden group bg-slate-900/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Satellite className="w-5 h-5 text-blue-400" /> Space Layer Sim
            </h2>
            <p className="text-sm text-slate-400 mb-6">Simulate edge-processed anomaly detection using ML models and transmit via narrow-band to Ground Station.</p>
            <button 
              onClick={triggerEdgeSimulation}
              disabled={isTransmitting}
              className={`w-full py-3 transition-colors rounded-lg font-medium text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 ${isTransmitting ? 'bg-slate-600 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              <Activity className={`w-4 h-4 ${isTransmitting ? 'animate-spin' : ''}`} /> 
              {isTransmitting ? 'Transmitting...' : 'Transmit Anomaly'}
            </button>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-700/50 shadow-xl flex-1 bg-slate-900/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-indigo-400" /> Ground Station Status
            </h2>
            <div className="space-y-4">
              <StatRow label="Active Satellites" value={dashboardStatus?.active_satellites || "--"} highlight={false} status={null} />
              <StatRow label="Anomalies Tracked" value={dashboardStatus?.anomalies_detected || "--"} highlight={true} status={null} />
              <StatRow label="Bandwidth Saved" value={`${dashboardStatus?.bandwidth_saved_mb || "--"} MB`} highlight={false} status={null} />
              <StatRow label="System Health" value={dashboardStatus?.system_health || "--"} highlight={false} status="good" />
            </div>
          </div>
        </div>

        {/* Center - Interactive 3D Globe */}
        <div className="lg:col-span-6 rounded-xl overflow-hidden shadow-2xl relative">
          <MapVisualization anomalyData={anomalyData} />
        </div>

        {/* Right Sidebar - RAG Report */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-xl border border-slate-700/50 shadow-xl flex-1 flex flex-col overflow-hidden relative bg-slate-900/50">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Intelligence Report
            </h2>
            
            {anomalyData ? (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  <h3 className="text-red-400 font-semibold text-sm uppercase tracking-wider mb-1">Critical Alert</h3>
                  <p className="text-white text-lg font-medium">{anomalyData.received_data.type}</p>
                  <p className="text-slate-400 text-xs mt-1">Grid: {anomalyData.received_data.location.grid} | Lat: {anomalyData.received_data.location.lat}</p>
                </div>

                <div className="bg-black/50 p-3 rounded-lg border border-slate-800">
                  <h3 className="text-blue-400 font-semibold mb-2 text-xs uppercase tracking-wider">RAG Context Retrieved</h3>
                  <p className="text-slate-300 text-xs italic border-l-2 border-blue-500 pl-2">"{anomalyData.rag_context_used.slice(0, 120)}..."</p>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-slate-800">
                  <h3 className="text-emerald-400 font-semibold mb-2 text-xs uppercase tracking-wider">Mitigation Directives</h3>
                  <div className="text-[#7ee787] text-xs whitespace-pre-wrap font-mono bg-black/80 p-3 rounded border border-slate-800">
                    {anomalyData.generated_report}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                <AlertTriangle className="w-12 h-12 mb-3 opacity-20" />
                <p>Waiting for Edge transmission...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const StatRow = ({ label, value, highlight, status }: { label: string, value: string, highlight: boolean, status: string | null }) => (
  <div className="flex justify-between items-center pb-2 border-b border-slate-800 last:border-0">
    <span className="text-slate-400 text-sm">{label}</span>
    <span className={`font-semibold ${highlight ? 'text-blue-400' : ''} ${status === 'good' ? 'text-emerald-400' : ''} text-white`}>
      {value}
    </span>
  </div>
);

export default App;
