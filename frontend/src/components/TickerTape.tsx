import React, { useEffect, useRef, useState } from 'react';

interface TickerItem {
  label: string;
  value: string;
  color?: string;
}

interface TickerTapeProps {
  currentFlux: any;
  forecast: any;
  flareClass: string;
}

const TickerTape: React.FC<TickerTapeProps> = ({ currentFlux, forecast, flareClass }) => {
  const tickerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<TickerItem[]>([]);

  // Format IST timestamp
  const nowIST = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  useEffect(() => {
    const flareColor =
      flareClass === 'X' ? 'text-red-400' :
      flareClass === 'M' ? 'text-orange-400' :
      flareClass === 'C' ? 'text-yellow-400' : 'text-emerald-400';

    const newItems: TickerItem[] = [
      { label: 'IST', value: nowIST },
      { label: 'GOES X-Ray Flux', value: currentFlux?.flux_scientific || '---', color: flareColor },
      { label: 'NOAA Class', value: currentFlux?.noaa_class || '---', color: flareColor },
      { label: 'Alert', value: currentFlux?.alert_level || 'NORMAL', color: flareColor },
      { label: 'M+ Flare Probability (6h)', value: forecast?.probability ? `${(forecast.probability * 100).toFixed(1)}%` : '---' },
      { label: 'Aditya-L1 SoLEXS Feed', value: 'ACTIVE', color: 'text-emerald-400' },
      { label: 'ISRO Mission Control', value: 'NOMINAL', color: 'text-emerald-400' },
      { label: 'NavIC L5 Integrity', value: flareClass === 'X' ? 'DEGRADED' : flareClass === 'M' ? 'MONITOR' : 'NOMINAL', color: flareColor },
      { label: 'BAH 2026', value: 'VyomOS v2.0 | ISRO Solar Flare Forecasting' },
    ];
    setItems(newItems);
  }, [currentFlux, forecast, flareClass, nowIST]);

  return (
    <div className="w-full overflow-hidden bg-gray-950 border-b border-gray-800 py-1.5 px-4 relative">
      <div
        ref={tickerRef}
        className="flex gap-0 whitespace-nowrap animate-[ticker_40s_linear_infinite]"
        style={{ animationName: 'ticker' }}
      >
        {/* Duplicate for seamless loop */}
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 mr-8 text-xs">
            <span className="text-slate-500 uppercase tracking-wider">{item.label}:</span>
            <span className={`font-mono font-semibold ${item.color || 'text-slate-300'}`}>{item.value}</span>
            <span className="text-slate-700 ml-6">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerTape;
