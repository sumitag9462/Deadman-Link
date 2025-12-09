// src/pages/Admin/AdminDashboard.jsx
import React from 'react';
import { Users, Link2, Activity, Smartphone } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatsCard } from '../../components/analytics/StatsCard';
import { ClickChart } from '../../components/analytics/ClickChart';
import { useFetch } from '../../hooks/useFetch';

const AdminDashboard = () => {
  const { data, loading, error } = useFetch('/admin/overview');

  const totalLinks = data?.totalLinks ?? 0;
  const totalClicks = data?.totalClicks ?? 0;
  const activeLinks = data?.activeLinks ?? 0;
  const uniqueVisitors = data?.uniqueVisitors ?? 0;
  const mobilePercent = data?.mobilePercent ?? 0;
  const timeline = data?.timeline ?? [];
  const recentEvents = data?.recentEvents ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            High-level view of Deadman-Link activity and health.
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-500">
          LIVE • ADMIN CONSOLE
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-400">
          Failed to load admin overview: {error.message || 'Unknown error'}
        </p>
      )}

      {/* Top stats row – all real data now */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Clicks"
          value={loading ? '…' : totalClicks.toLocaleString()}
          icon={Activity}
        />
        <StatsCard
          title="Total Links"
          value={loading ? '…' : totalLinks.toLocaleString()}
          icon={Link2}
        />
        <StatsCard
          title="Active Links"
          value={loading ? '…' : activeLinks.toLocaleString()}
          icon={Users}
        />
        <StatsCard
          title="Mobile Share"
          value={loading ? '…' : `${mobilePercent}%`}
          icon={Smartphone}
        />
      </div>

      {/* Charts + alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[420px]">
        {/* Traffic chart */}
        <div className="lg:col-span-2 h-full">
          <ClickChart data={timeline} loading={loading} />
        </div>

        {/* Recent system alerts (derived from analytics events for now) */}
        <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Recent System Alerts
              </h2>
              <p className="text-xs text-slate-500">
                Latest link activity across the platform.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {loading && (
              <p className="text-xs text-slate-500">Loading activity…</p>
            )}

            {!loading && recentEvents.length === 0 && (
              <p className="text-xs text-slate-500">
                No events logged yet. Share a link to start the feed.
              </p>
            )}

            {!loading &&
              recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2"
                >
                  <p className="text-xs text-slate-200">{ev.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(ev.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
