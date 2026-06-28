import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Target } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const HaloCmeDetector: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchPlasma = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/swis-aspex`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching SWIS-ASPEX data:', err);
      }
    };
    fetchPlasma();
    const interval = setInterval(fetchPlasma, 2000); // Fast polling for plasma simulation
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  const isHalo = data.ml_classification === 'HALO_CME_DETECTED';

  const chartData = [
    { subject: 'Density', A: data.plasma_parameters.particle_density_cm3, fullMark: 100 },
    { subject: 'Speed', A: data.plasma_parameters.proton_speed_kms / 10, fullMark: 150 },
    { subject: 'Temp', A: data.plasma_parameters.kinetic_temperature_K / 20000, fullMark: 150 },
  ];

  return (
    <div className={`bg-gray-900/80 border ${isHalo ? 'border-red-500/80 animate-pulse' : 'border-gray-700/60'} rounded-xl p-4 shadow-xl relative overflow-hidden transition-all duration-500`}>
      {isHalo && (
        <div className="absolute inset-0 bg-red-600/10 z-0 pointer-events-none"></div>
      )}
      
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            SWIS-ASPEX Plasma AI
          </h3>
          <p className="text-[10px] text-slate-500">Aditya-L1 Particle Stream Detector</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase text-slate-500 tracking-wider">Classification</div>
          <div className={`text-xs font-bold px-2 py-1 rounded mt-1 ${isHalo ? 'bg-red-600/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {data.ml_classification}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 relative z-10">
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Plasma" dataKey="A" stroke={isHalo ? '#ef4444' : '#8b5cf6'} fill={isHalo ? '#ef4444' : '#8b5cf6'} fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-col justify-center gap-3">
          <div>
            <div className="text-[10px] text-slate-500 uppercase">AI Probability Score</div>
            <div className="text-xl font-mono text-white">
              {data.anomaly_probability}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 mt-1 rounded overflow-hidden">
              <div 
                className={`h-full ${isHalo ? 'bg-red-500' : 'bg-purple-500'} transition-all duration-500`}
                style={{ width: `${data.anomaly_probability}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
            <div>
              <span className="text-slate-500 block">Density</span>
              {data.plasma_parameters.particle_density_cm3} cm³
            </div>
            <div>
              <span className="text-slate-500 block">Speed</span>
              {data.plasma_parameters.proton_speed_kms} km/s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HaloCmeDetector;
