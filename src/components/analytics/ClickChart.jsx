// src/components/analytics/ClickChart.jsx
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '../ui/Card';

export const ClickChart = ({ data = [], loading }) => {
  // Normalize API data -> recharts data
  const chartData = (data || []).map((point) => ({
    // show only MM-DD in label
    date: point.date ? point.date.slice(5) : '',
    clicks: typeof point.clicks === 'number' ? point.clicks : 0,
  }));

  const hasData = chartData.length > 0;

  return (
    <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Clicks Over Time
        </div>
        <span className="text-[10px] text-slate-500">Last 7 days</span>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Loading analytics…
          </div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            No click data yet. Share a link to start the feed.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tickLine={false}
                tickMargin={8}
                fontSize={10}
              />
              <YAxis
                stroke="#6b7280"
                tickLine={false}
                tickMargin={8}
                fontSize={10}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  border: '1px solid #1f2937',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value) => [`${value} clicks`, '']}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#22c55e"
                fill="url(#clicksGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
