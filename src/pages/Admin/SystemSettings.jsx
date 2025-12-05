// File: src/pages/Admin/SystemSettings.jsx
import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Shield, Globe, Zap, Save, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const SystemSettings = () => {
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("System configuration updated successfully.");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">System Configuration</h1>
        <Button onClick={handleSave} isLoading={loading} className="w-auto">
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Defaults */}
        <Card className="p-6 border-slate-800 bg-slate-900">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" /> Global Defaults
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Max Link TTL (Days)</label>
              <input type="number" defaultValue={30} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none" />
              <p className="text-[10px] text-slate-500 mt-1">Maximum time-to-live for standard user links.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Slug Rules (Regex)</label>
              <input type="text" defaultValue="^[a-zA-Z0-9-_]+$" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-emerald-400 font-mono text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-sm text-slate-300">Allow Anonymous Links</span>
                <input type="checkbox" className="accent-emerald-500 w-4 h-4" defaultChecked />
            </div>
          </div>
        </Card>

        {/* Rate Limits & Abuse */}
        <Card className="p-6 border-slate-800 bg-slate-900">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" /> Rate Limits & Abuse
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">API Rate Limit (Req/Min)</label>
              <div className="grid grid-cols-2 gap-4">
                 <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">Free</span>
                    <input type="number" defaultValue={60} className="w-full bg-slate-950 border border-slate-800 rounded pl-12 py-2 text-white text-right focus:border-emerald-500 outline-none" />
                 </div>
                 <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">Premium</span>
                    <input type="number" defaultValue={1000} className="w-full bg-slate-950 border border-slate-800 rounded pl-16 py-2 text-white text-right focus:border-emerald-500 outline-none" />
                 </div>
              </div>
            </div>
            
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">IP Blacklist</label>
                <textarea 
                    className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-3 text-red-400 font-mono text-xs focus:outline-none focus:border-red-500"
                    defaultValue={`192.168.0.1\n10.0.0.55\n172.16.0.0/12`}
                />
            </div>
          </div>
        </Card>

        {/* Retention Policy */}
        <Card className="p-6 border-slate-800 bg-slate-900 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" /> Data Retention Policy
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
             <div className="p-4 bg-slate-950 rounded border border-slate-800 text-center">
                <Clock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <h4 className="text-white font-medium">Audit Logs</h4>
                <p className="text-sm text-slate-400">Retain for 90 Days</p>
             </div>
             <div className="p-4 bg-slate-950 rounded border border-slate-800 text-center">
                <Shield className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <h4 className="text-white font-medium">Expired Links</h4>
                <p className="text-sm text-slate-400">Hard delete after 7 Days</p>
             </div>
             <div className="p-4 bg-slate-950 rounded border border-slate-800 text-center">
                <Globe className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <h4 className="text-white font-medium">Guest Data</h4>
                <p className="text-sm text-slate-400">Purge every 24 Hours</p>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemSettings;