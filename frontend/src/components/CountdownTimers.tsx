import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Countdown {
  label: string;
  totalSeconds: number;
  currentSeconds: number;
}

const CountdownTimers: React.FC = () => {
  const [timers, setTimers] = useState<Countdown[]>([
    { label: 'Next GOES Update', totalSeconds: 60, currentSeconds: 60 },
    { label: 'Next ML Inference', totalSeconds: 180, currentSeconds: 180 },
    { label: 'Aditya-L1 Telemetry', totalSeconds: 300, currentSeconds: 300 },
    { label: 'Advisory Refresh', totalSeconds: 900, currentSeconds: 900 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev =>
        prev.map(t => {
          const next = t.currentSeconds <= 1 ? t.totalSeconds : t.currentSeconds - 1;
          return { ...t, currentSeconds: next };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Operational Timers</h3>
      </div>
      <div className="space-y-2">
        {timers.map((t, i) => {
          const pct = (t.currentSeconds / t.totalSeconds) * 100;
          const isUrgent = pct < 20;
          return (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{t.label}</span>
                <span className={`font-mono font-bold ${isUrgent ? 'text-orange-400' : 'text-slate-300'}`}>
                  {formatTime(t.currentSeconds)}
                </span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-orange-500' : 'bg-blue-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CountdownTimers;
