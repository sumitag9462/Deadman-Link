// src/components/analytics/GeoMap.jsx
import React from 'react';
import { Card } from '../ui/Card';
import { Globe } from 'lucide-react';

export const GeoMap = ({ data = [], loading }) => {
  const regions = (data || [])
    .filter((d) => d && d.country)
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

  const hasData = regions.length > 0;

  return (
    <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Top Regions
            </div>
            <div className="text-[10px] text-slate-500">
              Geo distribution
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Loading geo data…
        </div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm text-center px-4">
          No geo data yet. Once users start clicking from different regions, you'll see them here.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 mt-2">
          {regions.map((region, idx) => (
            <div
              key={`${region.country}-${idx}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-4 text-right">
                  {idx + 1}.
                </span>
                <span className="text-sm text-slate-200">
                  {region.country || 'Unknown'}
                </span>
              </div>
              <div className="text-xs font-mono text-emerald-400">
                {region.clicks ?? 0} clicks
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
