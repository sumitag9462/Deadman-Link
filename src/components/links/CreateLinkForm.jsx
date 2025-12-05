import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Lock, Link as LinkIcon, Clock, Flame, Calendar, Eye, ShieldAlert, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export const CreateLinkForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // basic, security, advanced

  const [form, setForm] = useState({
    url: '',
    slug: '',
    title: '',
    // Security Config
    password: '',
    isOneTime: false,
    maxClicks: 0, // 0 = infinite
    expiresAt: '', // Date string
    // Advanced
    showPreview: false, // Intermediate safety page
    collection: 'General',
    scheduleStart: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate Server-Side Logic
    setTimeout(() => {
      const newLink = {
        _id: Date.now().toString(),
        title: form.title || form.url,
        slug: form.slug || Math.random().toString(36).substring(7),
        targetUrl: form.url,
        clicks: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        // Feature Flags for UI
        isLocked: !!form.password,
        isBurn: form.isOneTime || form.maxClicks > 0,
        hasPreview: form.showPreview,
        expiresAt: form.expiresAt
      };
      
      toast.success("Link encrypted & armed.");
      setLoading(false);
      if (onSuccess) onSuccess(newLink);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-4">
        {['basic', 'security', 'advanced'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab 
                ? 'text-emerald-500 border-b-2 border-emerald-500' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* BASIC TAB */}
        {activeTab === 'basic' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
            <Input
              label="Destination URL"
              placeholder="https://topsecret.com/payload"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
              icon={<LinkIcon className="w-4 h-4" />}
            />
            <Input
              label="Link Title (Optional)"
              placeholder="Operation Blackbriar"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
                <Input
                label="Custom Slug"
                placeholder="my-custom-link"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="font-mono text-sm"
                />
                <div className="relative">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        Collection
                    </label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select 
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-10 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none"
                            value={form.collection}
                            onChange={(e) => setForm({...form, collection: e.target.value})}
                        >
                            <option value="General">General</option>
                            <option value="Intel">Intel</option>
                            <option value="Personal">Personal</option>
                        </select>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             {/* Password */}
            <Input
              label="Password Protection"
              type="password"
              placeholder="Leave empty for public access"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              icon={<Lock className="w-4 h-4" />}
            />
            
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg space-y-4">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" /> Destruction Rules
                </h4>
                
                {/* One Time Toggle */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Burn after reading (1 view)</span>
                    <input 
                        type="checkbox" 
                        className="accent-emerald-500 w-4 h-4"
                        checked={form.isOneTime}
                        onChange={(e) => setForm({...form, isOneTime: e.target.checked, maxClicks: e.target.checked ? 1 : 0})}
                    />
                </div>

                {/* Multi-Use Countdown */}
                {!form.isOneTime && (
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 uppercase">Max Access Count</label>
                        <input 
                            type="number" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm"
                            placeholder="e.g. 5 (0 for unlimited)"
                            value={form.maxClicks}
                            onChange={(e) => setForm({...form, maxClicks: parseInt(e.target.value)})}
                        />
                    </div>
                )}

                {/* Date Expiry */}
                <div className="space-y-2">
                     <label className="text-xs text-slate-500 uppercase">Self-Destruct Date</label>
                     <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="datetime-local" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-10 py-2 text-white text-sm [&::-webkit-calendar-picker-indicator]:invert"
                            value={form.expiresAt}
                            onChange={(e) => setForm({...form, expiresAt: e.target.value})}
                        />
                     </div>
                </div>
            </div>
          </div>
        )}

        {/* ADVANCED TAB */}
        {activeTab === 'advanced' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                {/* Preview Mode */}
                <div className="p-4 border border-slate-800 rounded-lg flex items-start gap-3 bg-slate-900/30 hover:border-emerald-500/50 transition-colors cursor-pointer" onClick={() => setForm({...form, showPreview: !form.showPreview})}>
                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${form.showPreview ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                        {form.showPreview && <Eye className="w-3 h-3 text-slate-950" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-white">Safe Preview Mode</h4>
                        <p className="text-xs text-slate-400 mt-1">Show a "Proceed with Caution" page before redirecting. Useful for warning users about sensitive content.</p>
                    </div>
                </div>

                {/* Scheduled Activation */}
                <div className="space-y-2">
                     <label className="text-xs text-slate-500 uppercase">Scheduled Activation</label>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="datetime-local" 
                            className="w-full bg-slate-950 border border-slate-800 rounded px-10 py-2 text-white text-sm [&::-webkit-calendar-picker-indicator]:invert"
                            value={form.scheduleStart}
                            onChange={(e) => setForm({...form, scheduleStart: e.target.value})}
                        />
                     </div>
                     <p className="text-[10px] text-slate-500">Link will remain a "404" until this time.</p>
                </div>
             </div>
        )}

        <div className="pt-4 border-t border-slate-800">
          <Button type="submit" isLoading={loading}>
            {loading ? 'Encrypting...' : 'Generate Deadman Link'}
          </Button>
        </div>
      </form>
    </div>
  );
};