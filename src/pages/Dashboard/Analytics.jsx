import React from 'react';
import { BarChart3, Globe, MousePointer2, Smartphone } from 'lucide-react';
import { StatsCard } from '../../components/analytics/StatsCard';
import { ClickChart } from '../../components/analytics/ClickChart';
import { GeoMap } from '../../components/analytics/GeoMap';
import { useFetch } from '../../hooks/useFetch';

const Analytics = () => {
    // We can fetch summary stats here if we want
    const { data } = useFetch('/analytics');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Traffic Intelligence</h1>
          <span className="text-xs font-mono text-emerald-500 animate-pulse">LIVE FEED ACTIVE</span>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Clicks" value={data?.total || "1,245"} icon={MousePointer2} trend="12" />
        <StatsCard title="Active Links" value="8" icon={BarChart3} />
        <StatsCard title="Top Location" value="USA" icon={Globe} />
        <StatsCard title="Mobile Users" value={data?.mobile ? `${data.mobile}%` : "64%"} icon={Smartphone} trend="5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 h-full">
            <ClickChart />
        </div>

        {/* Map Area */}
        <div className="h-full">
            <GeoMap />
        </div>
      </div>
    </div>
  );
};

export default Analytics;