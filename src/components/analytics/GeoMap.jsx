import React from 'react';
import { Card } from '../ui/Card';

export const GeoMap = () => {
  // Mock Pings
  const pings = [
    { id: 1, top: '30%', left: '20%', city: 'New York' },
    { id: 2, top: '45%', left: '48%', city: 'London' },
    { id: 3, top: '60%', left: '75%', city: 'Bangalore' },
    { id: 4, top: '25%', left: '85%', city: 'Tokyo' },
  ];

  return (
    <Card className="p-0 border-slate-800 bg-slate-900 overflow-hidden relative h-full min-h-[300px]">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-lg font-semibold text-white">Threat Map</h3>
        <p className="text-xs text-slate-400">Real-time geolocation hits</p>
      </div>

      <div className="w-full h-full bg-[#0b1121] relative opacity-80">
        {/* Abstract World Grid Background */}
        <div className="absolute inset-0" 
            style={{ 
                backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}
        ></div>

        {/* Rough CSS shapes for continents (Abstract Representation) */}
        {/* North America */}
        <div className="absolute top-[15%] left-[5%] w-[25%] h-[30%] bg-slate-800/30 rounded-full blur-xl"></div>
        {/* South America */}
        <div className="absolute top-[50%] left-[15%] w-[15%] h-[35%] bg-slate-800/30 rounded-full blur-xl"></div>
        {/* Europe/Africa */}
        <div className="absolute top-[20%] left-[40%] w-[20%] h-[50%] bg-slate-800/30 rounded-full blur-xl"></div>
        {/* Asia */}
        <div className="absolute top-[15%] left-[60%] w-[35%] h-[40%] bg-slate-800/30 rounded-full blur-xl"></div>

        {/* Pings */}
        {pings.map(ping => (
            <div 
                key={ping.id} 
                className="absolute w-3 h-3 group"
                style={{ top: ping.top, left: ping.left }}
            >
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-950"></span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap z-20">
                    <div className="bg-slate-800 text-white text-xs py-1 px-2 rounded border border-slate-700 shadow-xl">
                        {ping.city}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </Card>
  );
};