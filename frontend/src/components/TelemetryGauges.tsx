import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';

interface TelemetryGaugesProps {
  satelliteName: string;
  isAlert: boolean;
}

const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ satelliteName, isAlert }) => {
  const [data, setData] = useState([
    { name: 'Battery (%)', value: 95, fill: '#10b981' },
    { name: 'Solar Output (W)', value: 1200, fill: '#f59e0b' },
    { name: 'Temp (°C)', value: 20, fill: '#3b82f6' },
    { name: 'Attitude Error (°)', value: 0.1, fill: '#8b5cf6' },
    { name: 'Signal (dBm)', value: -65, fill: '#ec4899' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(metric => {
        // Random walk
        let change = (Math.random() - 0.5) * (isAlert ? 10 : 2);
        let newValue = Math.max(0, metric.value + change);
        
        // Custom logic for different metrics
        if (metric.name === 'Battery (%)') newValue = Math.min(100, newValue);
        if (metric.name === 'Solar Output (W)') newValue = isAlert ? Math.max(0, metric.value - 50) : Math.min(1500, newValue);
        if (metric.name === 'Temp (°C)') {
          change = (Math.random() - 0.5) * (isAlert ? 5 : 1);
          newValue = metric.value + change;
          if (isAlert) newValue += 2; // Temp rises during alert
        }
        if (metric.name === 'Signal (dBm)') {
          newValue = isAlert ? -85 + (Math.random() * 10) : -65 + (Math.random() * 5); // Signal degrades
        }
        if (metric.name === 'Attitude Error (°)') {
          newValue = isAlert ? Math.min(5, metric.value + Math.random()) : Math.max(0, metric.value + (Math.random() - 0.5) * 0.1);
        }

        // Color shifts during alert
        let fill = metric.fill;
        if (isAlert) {
          if (metric.name === 'Battery (%)' && newValue < 50) fill = '#ef4444';
          if (metric.name === 'Temp (°C)' && newValue > 40) fill = '#ef4444';
          if (metric.name === 'Signal (dBm)' && newValue < -80) fill = '#ef4444';
        }

        return { ...metric, value: Number(newValue.toFixed(1)), fill };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAlert]);

  return (
    <div className="bg-gray-900/80 border border-gray-700/60 rounded-xl p-4 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{satelliteName} Telemetry</h3>
        {isAlert && <span className="animate-pulse text-xs text-red-500 font-bold">ANOMALY</span>}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={data}
            startAngle={180} endAngle={-180}
          >
            <RadialBar
              label={{ position: 'insideStart', fill: '#fff', fontSize: 10, offset: 5 }}
              background
              dataKey="value"
            />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
            <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, fontSize: '10px' }} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TelemetryGauges;
