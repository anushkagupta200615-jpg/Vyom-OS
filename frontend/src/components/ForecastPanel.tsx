import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';

interface ForecastPanelProps {
  probability: number;
  historyData: any[];
  forecastData: any[];
  peakTime?: string;
}

const FlareGauge: React.FC<{ probability: number }> = ({ probability }) => {
  // SVG semicircle gauge
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (probability / 100) * circumference;

  let color = '#22c55e'; // green
  if (probability >= 30) color = '#eab308'; // yellow
  if (probability >= 60) color = '#f97316'; // orange
  if (probability >= 80) color = '#ef4444'; // red

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-48">
      <svg className="w-full h-full transform -rotate-180" viewBox="0 0 200 100">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#374151"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute top-1/2 transform translate-y-4 flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>{probability.toFixed(0)}%</span>
        <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">M+ Flare Probability</span>
        <span className="text-[10px] text-gray-500 mt-0.5">Next 6 Hours</span>
      </div>
    </div>
  );
};

const ForecastPanel: React.FC<ForecastPanelProps> = ({ probability, historyData, forecastData, peakTime }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-gray-900 bg-opacity-50 backdrop-filter backdrop-blur-lg border border-gray-700 rounded-xl p-4 shadow-xl text-white">
      
      {/* PART A: Gauge */}
      <div className="col-span-1 border-r border-gray-800 pr-4 flex flex-col justify-center">
        <h3 className="text-lg font-semibold mb-2">Flare Nowcast</h3>
        <FlareGauge probability={probability} />
      </div>

      {/* PART B: Chart */}
      <div className="col-span-1 lg:col-span-2 flex flex-col h-64 w-full">
        <h3 className="text-lg font-semibold mb-2">24H Forecast (X-ray Flux)</h3>
        <div className="flex-grow">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={[...historyData, ...forecastData]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                tick={{fill: '#9CA3AF', fontSize: 10}} 
                tickFormatter={(val) => {
                  if (!val) return '';
                  const d = new Date(val);
                  return `${d.getHours()}:00`;
                }}
              />
              <YAxis 
                scale="log" 
                domain={[1e-9, 1e-3]} 
                tick={{fill: '#9CA3AF', fontSize: 10}}
                tickFormatter={(val) => val.toExponential(0)}
              />
              <Tooltip 
                contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB'}}
                itemStyle={{color: '#60A5FA'}}
                labelFormatter={(val) => val ? new Date(val).toLocaleString() : ''}
              />
              
              {/* Threshold lines */}
              <ReferenceLine y={1e-4} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'X-Class', fill: '#EF4444', fontSize: 10 }} />
              <ReferenceLine y={1e-5} stroke="#F97316" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'M-Class', fill: '#F97316', fontSize: 10 }} />
              <ReferenceLine y={1e-6} stroke="#EAB308" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'C-Class', fill: '#EAB308', fontSize: 10 }} />
              
              {/* Peak time reference */}
              {peakTime && <ReferenceLine x={peakTime} stroke="#EF4444" strokeDasharray="5 5" />}

              {/* Historical Data */}
              <Line type="monotone" dataKey="actual_flux" stroke="#9CA3AF" strokeWidth={2} dot={false} />
              
              {/* Predicted Data */}
              <Line type="monotone" dataKey="predicted_flux" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="upper_bound" stroke="none" fill="#3B82F6" fillOpacity={0.1} />
              <Area type="monotone" dataKey="lower_bound" stroke="none" fill="#3B82F6" fillOpacity={0.1} />
              
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ForecastPanel;
