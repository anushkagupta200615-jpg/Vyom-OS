import React, { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as satellite from 'satellite.js';
import * as THREE from 'three';

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
  const [cmeArcs, setCmeArcs] = useState<any[]>([]);
  const [terminatorPath, setTerminatorPath] = useState<any[]>([]);
  const [cmeArrivalCount, setCmeArrivalCount] = useState<number>(0);
  const [sunPos, setSunPos] = useState({ lat: 0, lng: 0 });
  
  const isHighAlert = flareClass === 'M' || flareClass === 'X';

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2.5, lat: 20, lng: 78 }, 2000);
    }
  }, []);

  const [activeTles, setActiveTles] = useState<any>(TLE_DATA);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    // Generate static historical anomaly heatmap data (simulated 30-day density)
    const hData = [
      // South Atlantic Anomaly (High density)
      ...Array(150).fill(0).map(() => ({ lat: -25 + (Math.random()*20 - 10), lng: -45 + (Math.random()*40 - 20), weight: Math.random() * 2 })),
      // Polar Regions (Medium density)
      ...Array(80).fill(0).map(() => ({ lat: 75 + (Math.random()*10 - 5), lng: Math.random()*360 - 180, weight: Math.random() })),
      ...Array(80).fill(0).map(() => ({ lat: -75 + (Math.random()*10 - 5), lng: Math.random()*360 - 180, weight: Math.random() })),
      // Random sporadic
      ...Array(100).fill(0).map(() => ({ lat: Math.random()*180 - 90, lng: Math.random()*360 - 180, weight: Math.random() * 0.5 }))
    ];
    setHeatmapData(hData);
  }, []);

  useEffect(() => {
    const fetchTles = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tle`);
        if (res.ok) {
          const data = await res.json();
          if (Object.keys(data).length > 0) {
            setActiveTles(data);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live TLEs, using static fallback.');
      }
    };
    fetchTles();
    const interval = setInterval(fetchTles, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updatePositions = () => {
      const now = new Date();
      
      // Calculate Subsolar Point
      const hours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const dayOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
      const w = (2 * Math.PI / 365.24) * (dayOfYear + hours / 24 - 1);
      
      // Declination
      const decl = 0.39637 * Math.sin(w) + 0.0042 * Math.sin(2*w) + 0.0026 * Math.sin(3*w);
      const lat_s = decl; 
      
      // Equation of time
      const eqTime = -7.66 * Math.sin(w) - 9.87 * Math.sin(2 * w + 3.49); 
      const trueSolarTime = hours * 60 + eqTime / 60; 
      let lng_s = (12 - trueSolarTime) * 15; 
      
      // Normalize lng
      if (lng_s > 180) lng_s -= 360;
      if (lng_s < -180) lng_s += 360;
      
      setSunPos({ lat: lat_s * 180 / Math.PI, lng: lng_s });

      const lng_s_rad = lng_s * Math.PI / 180;
      
      const Sx = Math.cos(lat_s) * Math.cos(lng_s_rad);
      const Sy = Math.cos(lat_s) * Math.sin(lng_s_rad);
      const Sz = Math.sin(lat_s);
      
      const Ulen = Math.sqrt(Sy*Sy + Sx*Sx);
      const Ux = -Sy / Ulen;
      const Uy = Sx / Ulen;
      const Uz = 0;
      
      const Vx = -Sz * Uy;
      const Vy = Sz * Ux;
      const Vz = Sx * Uy - Sy * Ux;
      
      const termPath = [];
      // Generate 180 points for a smooth great circle
      for(let i=0; i<=180; i++) {
        const t = i * 2 * Math.PI / 180;
        const px = Ux * Math.cos(t) + Vx * Math.sin(t);
        const py = Uy * Math.cos(t) + Vy * Math.sin(t);
        const pz = Uz * Math.cos(t) + Vz * Math.sin(t);
        
        const lat = Math.asin(pz) * 180 / Math.PI;
        const lng = Math.atan2(py, px) * 180 / Math.PI;
        termPath.push([lat, lng, 0.002]); // slightly above surface
      }
      // Add first point again to close the loop
      termPath.push(termPath[0]);
      
      setTerminatorPath([{ name: 'terminator', path: termPath }]);

      const newSatData: any[] = [];
      const newPathsData: any[] = [];

      Object.entries(activeTles).forEach(([name, tle]) => {
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
            alt: height / 6371,
            heightKm: Math.round(height)
          });
          
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
    };

    updatePositions();
    const interval = setInterval(updatePositions, 10000);
    return () => clearInterval(interval);
  }, [activeTles]);

  // Trigger CME Propagation Arc
  useEffect(() => {
    if (isHighAlert) {
      const arcColor = flareClass === 'X' ? '#ef4444' : '#f97316';
      setCmeArcs([{
        startLat: sunPos.lat,
        startLng: sunPos.lng,
        endLat: 20, // Aim towards India
        endLng: 78,
        color: arcColor
      }]);
      
      const timer = setTimeout(() => {
        setCmeArrivalCount(prev => prev + 1);
        setCmeArcs([]); 
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setCmeArcs([]);
    }
  }, [isHighAlert, flareClass, sunPos]);

  // Combine Rings for Aurora and HF Blackout
  const activeRings = [];
  if (cmeArrivalCount > 0) {
    activeRings.push({ lat: 70, lng: 0, type: 'aurora' }, { lat: -70, lng: 0, type: 'aurora' });
  }
  if (isHighAlert) {
    activeRings.push({ lat: sunPos.lat, lng: sunPos.lng, type: 'blackout' });
  }

  // Anomaly Correlation Arcs (Connect affected satellites during high alert)
  const correlationArcs = [];
  if (isHighAlert && satData.length >= 2) {
    for (let i = 0; i < satData.length - 1; i++) {
      correlationArcs.push({
        startLat: satData[i].lat,
        startLng: satData[i].lng,
        endLat: satData[i+1].lat,
        endLng: satData[i+1].lng,
        color: 'rgba(249, 115, 22, 0.8)' // Orange
      });
    }
    // Close the loop
    correlationArcs.push({
      startLat: satData[satData.length-1].lat,
      startLng: satData[satData.length-1].lng,
      endLat: satData[0].lat,
      endLng: satData[0].lng,
      color: 'rgba(249, 115, 22, 0.8)'
    });
  }

  const customLayerData = [{ lat: sunPos.lat, lng: sunPos.lng, alt: 3 }];

  return (
    <div 
      className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-black"
      style={{
        backgroundImage: 'url("//unpkg.com/three-globe/example/img/night-sky.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
        {/* Heatmap Toggle */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${showHeatmap ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-600 hover:text-white'}`}
          >
            {showHeatmap ? 'Heatmap: ON' : 'Heatmap: OFF'}
          </button>
        </div>

      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        
        // Heatmap
        hexBinPointsData={showHeatmap ? heatmapData : []}
        hexBinPointWeight="weight"
        hexAltitude={(d: any) => d.sumWeight * 0.005}
        hexBinResolution={4}
        hexTopColor={(d: any) => d.sumWeight > 5 ? '#ef4444' : '#f59e0b'}
        hexSideColor={() => 'rgba(0,0,0,0)'}
        hexBinMerge={true}
        hexTransitionDuration={1000}

        // Satellites
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
        
        // Satellite orbits + Terminator Line
        pathsData={[...pathsData, ...terminatorPath]}
        pathPoints="path"
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathPointAlt={(p: any) => p[2]}
        pathColor={(d: any) => d.name === 'terminator' ? 'rgba(255,165,0,0.6)' : 'rgba(56, 189, 248, 0.3)'}
        pathDashLength={(d: any) => d.name === 'terminator' ? 0.02 : 0.01}
        pathDashGap={(d: any) => d.name === 'terminator' ? 0.01 : 0.005}
        pathDashAnimateTime={(d: any) => d.name === 'terminator' ? 4000 : 100000}
        
        // Satellite Labels
        labelsData={satData}
        labelLat="lat"
        labelLng="lng"
        labelAltitude={(d: any) => d.alt + 0.05}
        labelDotRadius={0}
        labelText="name"
        labelSize={1.5}
        labelColor={() => isHighAlert ? '#ef4444' : '#60a5fa'}
        labelResolution={2}
        
        // CME Propagation & Correlation Arcs
        arcsData={[...cmeArcs, ...correlationArcs]}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={4}
        arcDashInitialGap={() => Math.random() * 4}
        arcDashAnimateTime={3000} 
        arcAltitude={1.5}
        arcStroke={2}
        
        // Aurora & HF Radio Blackout Rings
        ringsData={activeRings}
        ringLat="lat"
        ringLng="lng"
        ringColor={(d: any) => d.type === 'aurora' ? '#10b981' : 'rgba(239, 68, 68, 0.6)'} 
        ringMaxRadius={(d: any) => d.type === 'aurora' ? 25 : 85}
        ringPropagationSpeed={(d: any) => d.type === 'aurora' ? 3 : 8}
        ringRepeatPeriod={(d: any) => d.type === 'aurora' ? 800 : 2000}

        // Custom Sun geometry
        customLayerData={customLayerData}
        customThreeObject={(d: any) => {
          const group = new THREE.Group();
          
          const geometry = new THREE.SphereGeometry(0.2, 32, 32);
          const material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
          const sphere = new THREE.Mesh(geometry, material);
          group.add(sphere);

          const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4400,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
          });
          const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), glowMaterial);
          group.add(glowSphere);

          return group;
        }}
        customThreeObjectUpdate={(obj, d: any) => {
          Object.assign(obj.position, globeEl.current?.getCoords(d.lat, d.lng, d.alt));
        }}
      />
      
      {/* CME Countdown Overlay */}
      {isHighAlert && cmeArcs.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-500 rounded-lg px-4 py-2 text-white animate-pulse">
          <div className="text-xs font-bold uppercase tracking-wider text-red-200">CME Shockwave Inbound</div>
          <div className="font-mono text-center mt-1">Impact in ~34 Hours</div>
        </div>
      )}
    </div>
  );
};

export default ISROGlobe;
