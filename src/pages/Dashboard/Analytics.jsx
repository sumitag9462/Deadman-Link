// src/pages/Dashboard/Analytics.jsx
import React from 'react';
import { BarChart3, Globe, MousePointer2, Smartphone } from 'lucide-react';
import { StatsCard } from '../../components/analytics/StatsCard';
import { ClickChart } from '../../components/analytics/ClickChart';
import { GeoMap } from '../../components/analytics/GeoMap';
import { useFetch } from '../../hooks/useFetch';

const Analytics = () => {
  // Backend: GET /api/analytics -> { total, activeLinks, mobile, topLocation, timeline, geo }
  const { data, loading, error } = useFetch('/analytics');

  // Safely normalise values
  const totalClicks =
    typeof data?.total === 'number' ? data.total : 0;

  const activeLinks =
    typeof data?.activeLinks === 'number' ? data.activeLinks : 0;

  const mobilePercent =
    typeof data?.mobile === 'number' ? data.mobile : 0;

  const topLocation = data?.topLocation || 'Unknown';

  const timeline = Array.isArray(data?.timeline) ? data.timeline : [];
  const geo = Array.isArray(data?.geo) ? data.geo : [];

  if (import.meta.env.DEV) {
    // Helpful when debugging
    console.log('Analytics data from API:', data);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Traffic Intelligence
        </h1>
        <span className="text-xs font-mono text-emerald-500 animate-pulse">
          LIVE FEED ACTIVE
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-2">
          Failed to load analytics:{' '}
          {error.message || 'Unknown error'}
        </p>
      )}

      {/* Top Stats Row – all live data, no mock trend text */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Clicks"
          value={loading ? '…' : totalClicks.toLocaleString()}
          icon={MousePointer2}
        />
        <StatsCard
          title="Active Links"
          value={loading ? '…' : activeLinks.toString()}
          icon={BarChart3}
        />
        <StatsCard
          title="Top Location"
          value={loading ? '…' : topLocation}
          icon={Globe}
        />
        <StatsCard
          title="Mobile Users"
          value={loading ? '…' : `${mobilePercent}%`}
          icon={Smartphone}
        />
      </div>

      {/* Chart + Geo map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        <div className="lg:col-span-2 h-full">
          <ClickChart data={timeline} loading={loading} />
        </div>
        <div className="h-full">
          <GeoMap data={geo} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
