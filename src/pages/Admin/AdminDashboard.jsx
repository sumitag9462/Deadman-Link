import React from 'react';
import { StatsCard } from '../../components/analytics/StatsCard';
import { Users, Link, AlertTriangle, Activity } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { ClickChart } from '../../components/analytics/ClickChart';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">System Overview</h1>
      
      {/* Aggregate Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value="1,204" icon={Users} trend="8" />
        <StatsCard title="Total Links" value="84,392" icon={Link} trend="15" />
        <StatsCard title="Active Threats" value="3" icon={AlertTriangle} />
        <StatsCard title="System Load" value="42%" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
        <Card className="p-6 border-slate-800 bg-slate-900">
            <h3 className="text-lg font-semibold text-white mb-4">Traffic Volume (Global)</h3>
            <ClickChart data={[120, 150, 180, 140, 200, 230, 280]} />
        </Card>
        
        <Card className="p-6 border-slate-800 bg-slate-900">
            <h3 className="text-lg font-semibold text-white mb-4">Recent System Alerts</h3>
            <div className="space-y-4">
                {[
                    { msg: 'High traffic spike from IP 192.168.x.x', time: '10m ago', type: 'warn' },
                    { msg: 'New admin account created: admin_02', time: '1h ago', type: 'info' },
                    { msg: 'Database backup completed successfully', time: '4h ago', type: 'success' },
                    { msg: 'Link "x83d9" flagged for phishing', time: '5h ago', type: 'error' },
                ].map((alert, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-3 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-300">{alert.msg}</span>
                        <span className="text-xs text-slate-500">{alert.time}</span>
                    </div>
                ))}
            </div>
        </Card>
      </div>
    </div>
  );
};
export default AdminDashboard;