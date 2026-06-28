import React, { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as satellite from 'satellite.js';

interface ISROGlobeProps {
  flareClass: string;
}

// Static TLEs as fallback
const TLE_DATA = {
  'Cartosat-3': [
    '1 44793U 19081A   24133.48805602  .00000494  00000-0  17522-3 0  9997',
    '2 44793  97.6433 219.0494 0013970  96.0689 264.1950 14.80803524240755'
  ],
  'RISAT-2BR1': [
    '1 44857U 19089A   24133.36440237  .00001099  00000-0  34489-3 0  9997',
    '2 44857  37.0005  78.9691 0011400 327.9546  32.0722 14.84589252243460'
  ],
  'NavIC (IRNSS-1I)': [
    '1 43286U 18035A   24132.32759529 -.00000216  00000-0  00000-0 0  9991',
    '2 43286  29.0202 268.0415 0018598 250.3175 220.0863  1.00268579 22359'
  ]
};

const ISROGlobe: React.FC<ISROGlobeProps> = ({ flareClass }) => {
  const globeEl = useRef<any>(null);
  const [satData, setSatData] = useState<any[]>([]);
  const [pathsData, setPathsData] = useState<any[]>([]);
  const [ringsData, setRingsData] = useState<any[]>([]);
  
  const isHighAlert = flareClass === 'M' || flareClass === 'X';

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2.5 }, 4000);
    }
  }, []);

  useEffect(() => {
    const updatePositions = () => {
      const now = new Date();
      const newSatData: any[] = [];
      const newPathsData: any[] = [];

      Object.entries(TLE_DATA).forEach(([name, tle]) => {
        const satrec = satellite.twoline2satrec(tle[0], tle[1]);
        const positionAndVelocity = satellite.propagate(satrec, now);
        const positionEci = positionAndVelocity.position;
        
        if (typeof positionEci !== 'boolean' && positionEci) {
          const gmst = satellite.gstime(now);
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);
          const longitude = satellite.degreesLong(positionGd.longitude);
          const latitude = satellite.degreesLat(positionGd.latitude);
          const height = positionGd.height;

          newSatData.push({
            name,
            lat: latitude,
            lng: longitude,
            alt: height / 6371, // normalized to earth radius
            heightKm: Math.round(height)
          });
          
          // Generate path (last 45 mins)
          const pathCoords: any[] = [];
          for(let i=45; i>=0; i-=5) {
             const t = new Date(now.getTime() - i * 60000);
             const pv = satellite.propagate(satrec, t);
             if (typeof pv.position !== 'boolean' && pv.position) {
                 const gst = satellite.gstime(t);
                 const pGd = satellite.eciToGeodetic(pv.position, gst);
                 pathCoords.push([
                     satellite.degreesLat(pGd.latitude),
                     satellite.degreesLong(pGd.longitude),
                     pGd.height / 6371
                 ]);
             }
          }
          newPathsData.push({ name, path: pathCoords });
        }
      });
      
      setSatData(newSatData);
      setPathsData(newPathsData);
      
      // If high alert, show a simulated flare cone from sun
      if (isHighAlert) {
         const hours = now.getUTCHours() + now.getUTCMinutes()/60;
         const subsolarLng = 180 - (hours * 15);
         setRingsData([{
             lat: 0,
             lng: subsolarLng,
             maxR: 90,
             propagationSpeed: 5,
             repeatPeriod: 1000
         }]);
      } else {
         setRingsData([]);
      }
    };

    updatePositions();
    const interval = setInterval(updatePositions, 10000);
    return () => clearInterval(interval);
  }, [isHighAlert]);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-slate-700/50 flex items-center justify-center">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        pointsData={satData}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => isHighAlert ? '#ef4444' : '#ffffff'}
        pointAltitude="alt"
        pointRadius={0.1}
        pointLabel={(d: any) => `
          <div class="bg-gray-900 text-white p-2 rounded text-xs border border-gray-700">
             <strong>${d.name}</strong><br/>
             Alt: ${d.heightKm} km<br/>
             Status: ${isHighAlert ? '<span style="color:red">HIGH RISK</span>' : '<span style="color:green">NOMINAL</span>'}
          </div>
        `}
        
        pathsData={pathsData}
        pathPoints="path"
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathPointAlt={(p: any) => p[2]}
        pathColor={() => 'rgba(255,255,255,0.2)'}
        pathDashLength={0.01}
        pathDashGap={0.005}
        pathDashAnimateTime={100000}
        
        labelsData={satData}
        labelLat="lat"
        labelLng="lng"
        labelAltitude={(d: any) => d.alt + 0.05}
        labelDotRadius={0}
        labelText="name"
        labelSize={1.5}
        labelColor={() => isHighAlert ? '#ef4444' : '#60a5fa'}
        labelResolution={2}
        
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => '#ef4444'}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
      />
    </div>
  );
};

export default ISROGlobe;
