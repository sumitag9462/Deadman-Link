import React from 'react';
import { Card } from '../ui/Card';

export const StatsCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <Card className="p-6 border-slate-800 bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
        <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 text-xs font-medium text-emerald-400 flex items-center">
          <span>+{trend}% from last week</span>
        </div>
      )}
    </Card>
  );
};