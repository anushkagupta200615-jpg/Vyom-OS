import React, { useMemo } from 'react';
import { Satellite, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

// NavIC satellite bands & Indian city coordinates
const INDIAN_CITIES = [
  { name: 'New Delhi', lat: 28.6, lon: 77.2 },
  { name: 'Mumbai', lat: 19.0, lon: 72.8 },
  { name: 'Bangalore', lat: 12.9, lon: 77.6 },
  { name: 'Chennai', lat: 13.1, lon: 80.3 },
  { name: 'Kolkata', lat: 22.6, lon: 88.4 },
  { name: 'Ahmedabad', lat: 23.0, lon: 72.6 },
];

// Estimate TEC (Total Electron Content) based on flux & time of day
function estimateTEC(fluxW: number, city: { lat: number; lon: number }): number {
  const baselineTEC = 15; // TECU - typical daytime
  const solarEnhancement = Math.log10(fluxW / 1e-8) * 8; // dTEC per decade of flux
  const latFactor = Math.cos((city.lat * Math.PI) / 180); // equatorial is highest
  return Math.max(1, baselineTEC + solarEnhancement * latFactor);
}

// Compute GPS L5 signal positioning error from TEC (in meters)
function tecToError(tec: number): number {
  // L5 frequency: 1176.45 MHz. Ionospheric delay ≈ 40.3 * TEC / f²
  const f5 = 1176.45e6;
  const delayM = (40.3 * tec * 1e16) / (f5 * f5);
  return Math.round(delayM * 100) / 100;
}

interface NavICImpactProps {
  fluxValue: number;
  flareClass: string;
}

const NavICImpact: React.FC<NavICImpactProps> = ({ fluxValue, flareClass }) => {
  const cityData = useMemo(() => {
    const flux = fluxValue || 1e-8;
    return INDIAN_CITIES.map((city) => {
      const tec = estimateTEC(flux, city);
      const errorM = tecToError(tec);
      let status: 'nominal' | 'degraded' | 'critical';
      if (errorM < 5) status = 'nominal';
      else if (errorM < 15) status = 'degraded';
      else status = 'critical';
      return { ...city, tec: Math.round(tec * 10) / 10, errorM, status };
    });
  }, [fluxValue]);

  const getStatusStyle = (status: string) => {
    if (status === 'nominal') return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (status === 'degraded') return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
  };

  const getIcon = (status: string) => {
    if (status === 'nominal') return <Wifi className="w-3.5 h-3.5" />;
    if (status === 'degraded') return <AlertTriangle className="w-3.5 h-3.5" />;
    return <WifiOff className="w-3.5 h-3.5" />;
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-700 rounded-xl p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Satellite className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          NavIC L5 Signal Impact
        </h3>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
          flareClass === 'X' ? 'bg-red-500/20 text-red-400' :
          flareClass === 'M' ? 'bg-orange-500/20 text-orange-400' :
          'bg-emerald-500/20 text-emerald-400'
        }`}>{flareClass}-Class Event</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cityData.map((city) => {
          const style = getStatusStyle(city.status);
          return (
            <div key={city.name} className={`rounded-lg border p-2.5 ${style.bg} ${style.border}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">{city.name}</span>
                <span className={`flex items-center gap-1 text-xs ${style.text}`}>
                  {getIcon(city.status)}
                  {city.status.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span>TEC: <span className={style.text}>{city.tec} TECU</span></span>
                <span>Error: <span className={style.text}>±{city.errorM}m</span></span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-600 mt-2">
        * Ionospheric delay derived from GOES X-ray flux proxy. NavIC L5 (1176.45 MHz) single-frequency estimation.
      </p>
    </div>
  );
};

export default NavICImpact;
