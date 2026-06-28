import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SatelliteMatrixProps {
  flareClass: string;
  fluxValue: number;
  alertLevel: string;
}

interface SatelliteInfo {
  name: string;
  type: string;
  orbit: 'LEO' | 'GEO' | 'MEO' | 'Lunar' | 'L1';
}

const SATELLITES: SatelliteInfo[] = [
  { name: 'Cartosat-3', type: 'Earth Obs', orbit: 'LEO' },
  { name: 'RISAT-2BR1', type: 'Earth Obs', orbit: 'LEO' },
  { name: 'NavIC (IRNSS-1)', type: 'Nav', orbit: 'GEO' },
  { name: 'Chandrayaan-2 Orbiter', type: 'Lunar', orbit: 'Lunar' },
  { name: 'GSAT-30', type: 'Comm', orbit: 'GEO' },
  { name: 'Aditya-L1', type: 'Solar', orbit: 'L1' },
];

const SatelliteMatrix: React.FC<SatelliteMatrixProps> = ({ flareClass, fluxValue, alertLevel }) => {
  const getRiskAndAction = (orbit: string, flareClass: string) => {
    let risk = 'LOW';
    let action = 'Monitor';
    let color = 'text-green-400';

    if (flareClass === 'X') {
      risk = 'HIGH';
      action = 'Enter safe mode';
      color = 'text-red-500';
    } else if (flareClass === 'M') {
      if (orbit === 'LEO') {
        risk = 'MODERATE';
        action = 'Reduce imaging ops';
        color = 'text-orange-400';
      } else if (orbit === 'Lunar' || orbit === 'L1') {
        risk = 'MODERATE';
        action = 'Check sensor health';
        color = 'text-orange-400';
      } else {
        risk = 'LOW';
        action = 'Monitor';
        color = 'text-yellow-400';
      }
    } else if (flareClass === 'C') {
      risk = 'LOW';
      action = 'Routine ops';
      color = 'text-green-400';
    }

    return { risk, action, color };
  };

  const timestamp = useMemo(() => new Date().toLocaleTimeString(), [fluxValue]);

  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="bg-gray-900 bg-opacity-50 backdrop-filter backdrop-blur-lg border border-gray-700 rounded-xl p-4 shadow-xl text-white"
    >
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h2 className="text-xl font-semibold">ISRO Satellite Impact Matrix</h2>
        <div className="flex space-x-4 text-sm">
          <span>Class: <strong className="text-blue-400">{flareClass || 'N/A'}</strong></span>
          <span>Alert: <strong className="text-red-400">{alertLevel || 'N/A'}</strong></span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="pb-2 font-medium">Satellite</th>
              <th className="pb-2 font-medium">Mission Type</th>
              <th className="pb-2 font-medium">Risk Level</th>
              <th className="pb-2 font-medium">Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {SATELLITES.map((sat) => {
              const { risk, action, color } = getRiskAndAction(sat.orbit, flareClass);
              return (
                <tr key={sat.name} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-2 font-medium">{sat.name}</td>
                  <td className="py-2 text-gray-300">{sat.type}</td>
                  <td className={`py-2 font-bold ${color}`}>{risk}</td>
                  <td className="py-2 text-gray-300">{action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-right">
        Last updated: {timestamp}
      </div>
    </motion.div>
  );
};

export default SatelliteMatrix;
