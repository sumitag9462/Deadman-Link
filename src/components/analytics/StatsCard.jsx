// src/components/analytics/StatsCard.jsx
import React from 'react';
import { Card } from '../ui/Card';

export const StatsCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {title}
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="text-2xl font-semibold text-white">
        {value ?? '0'}
      </div>

      {trend && (
        <div className="mt-1 text-xs text-emerald-400">
          +{trend}% from last week
        </div>
      )}
    </Card>
  );
};
