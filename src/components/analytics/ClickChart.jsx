// src/components/analytics/ClickChart.jsx
import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
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
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.65} />
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
                domain={[0, (dataMax) => Math.max(dataMax, 5)]}
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

              <ReferenceLine y={0} stroke="#1f2937" />

              <Bar
                dataKey="clicks"
                barSize={14}
                radius={[4, 4, 0, 0]}
                fill="#16a34a"
                opacity={0.35}
              />

              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#22c55e"
                fill="url(#clicksGradient)"
                strokeWidth={2.4}
                dot={{ r: 3, fill: '#22c55e', stroke: '#0f172a', strokeWidth: 1 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
