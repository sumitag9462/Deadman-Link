import React from 'react';
import { Card } from '../ui/Card';

export const ClickChart = ({ data }) => {
  // Mock data generator if none provided
  const chartData = data || [45, 72, 48, 95, 110, 85, 130];
  const max = Math.max(...chartData);
  const min = 0;
  const range = max - min;

  // Calculate polyline points
  const points = chartData.map((val, index) => {
    const x = (index / (chartData.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 80; // keep some padding top/bottom
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card className="p-6 border-slate-800 bg-slate-900 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Signal Activity</h3>
        <select className="bg-slate-950 border border-slate-800 text-xs text-slate-400 rounded px-2 py-1">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      </div>

      <div className="relative h-64 w-full">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-600">
            {[100, 75, 50, 25, 0].map(p => (
                <div key={p} className="border-b border-slate-800/50 w-full h-0 relative">
                    <span className="absolute -top-3 right-0">{Math.round(max * (p/100))}</span>
                </div>
            ))}
        </div>

        {/* The Chart */}
        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Gradient Area */}
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon 
                points={`0,100 ${points} 100,100`} 
                fill="url(#chartGradient)" 
            />
            {/* The Line */}
            <polyline 
                points={points} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2" 
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Dots */}
            {chartData.map((val, index) => {
                 const x = (index / (chartData.length - 1)) * 100;
                 const y = 100 - ((val - min) / range) * 80;
                 return (
                    <circle 
                        key={index} 
                        cx={x} 
                        cy={y} 
                        r="1.5" 
                        className="fill-slate-950 stroke-emerald-500 stroke-2 hover:r-4 transition-all cursor-pointer"
                        vectorEffect="non-scaling-stroke"
                    >
                        <title>{val} clicks</title>
                    </circle>
                 );
            })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-4 px-1">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
      </div>
    </Card>
  );
};