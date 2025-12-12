// src/components/analytics/AnalyticsInsights.jsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function AnalyticsInsights({ linkId, days = 14 }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!linkId) return;
    setLoading(true);
    api.get(`/analytics/insights`, { params: { linkId, days } })
      .then((res) => setInsights(res.data))
      .catch((err) => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [linkId, days]);

  if (!linkId) return null;
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-semibold">AI Insights</h4>
            {insights?.summary && <div className="text-sm text-slate-400 mt-1">{insights.summary}</div>}
          </div>
          <div>
            <Button size="sm" onClick={() => { setLoading(true); api.get('/analytics/insights', { params: { linkId, days } }).then(r => setInsights(r.data)).finally(()=>setLoading(false)); }}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div style={{ height: 220 }}>
          {insights ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={insights.series.hourly.map(h=>({ ts: new Date(h.ts).toLocaleString(), count: h.count }))}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopOpacity={0.7} stopColor="#10b981"/>
                    <stop offset="100%" stopOpacity={0.05} stopColor="#10b981"/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ts" hide />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-slate-400">No data for selected link / period.</div>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-400">Peak hours</div>
          <div className="mt-2">
            {insights?.peakHours?.length ? (
              insights.peakHours.map(p => (
                <div key={p.hour} className="flex justify-between">
                  <div>Hour {p.hour}:00 (UTC)</div>
                  <div className="font-medium">{p.avg.toFixed(2)}</div>
                </div>
              ))
            ) : <div className="text-xs text-slate-400">No peak info</div>}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-slate-400">Spikes</div>
          <div className="mt-2">
            {insights?.spikes?.length ? (
              insights.spikes.map(s => (
                <div key={s.ts} className="flex justify-between">
                  <div className="text-xs">{new Date(s.ts).toLocaleString()}</div>
                  <div className="text-xs font-semibold">{s.count} (z={s.z})</div>
                </div>
              ))
            ) : <div className="text-xs text-slate-400">No unusual spikes</div>}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-slate-400">Predicted exhaustion</div>
          <div className="mt-2">
            {insights?.predictedExhaustion?.willExhaust ? (
              <>
                <div>Remaining clicks: <b>{insights.predictedExhaustion.remainingClicks}</b></div>
                <div>Rate/day (avg): <b>{insights.predictedExhaustion.ratePerDay}</b></div>
                <div>ETA: <b>{new Date(insights.predictedExhaustion.eta).toLocaleString()}</b></div>
              </>
            ) : <div className="text-xs text-slate-400">No exhaustion predicted (or unlimited)</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
