import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Lock,
  Link as LinkIcon,
  Clock,
  Flame,
  Calendar,
  Eye,
  Tag,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const CreateLinkForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // basic | security | advanced

  const [form, setForm] = useState({
    url: '',
    slug: '',
    title: '',
    creatorName: '',
    password: '',
    isOneTime: false,
    maxClicks: 0,
    expiresAt: '',
    showPreview: false,
    collection: 'General',
    scheduleStart: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.url.trim()) {
      toast.error('Destination URL is required');
      return;
    }

    if (
      form.url &&
      !form.url.startsWith('http://') &&
      !form.url.startsWith('https://')
    ) {
      toast.error('URL must start with http:// or https://');
      return;
    }

    setLoading(true);

    try {
      // normalize maxClicks for backend:
      // - if one-time -> 1
      // - else if >0 -> value
      // - else -> 0 (unlimited)
      const normalizedMaxClicks = form.isOneTime
        ? 1
        : form.maxClicks > 0
        ? form.maxClicks
        : 0;

      // Payload that matches backend POST /api/links
      const payload = {
        url: form.url, // ❗ backend expects `url`
        slug: form.slug || undefined,
        title: form.title || form.url,
        creatorName: form.creatorName || 'Anonymous',
        password: form.password || undefined,
        isOneTime: form.isOneTime,
        maxClicks: normalizedMaxClicks,
        expiresAt: form.expiresAt || undefined,
        showPreview: form.showPreview,
        collection: form.collection,
        scheduleStart: form.scheduleStart || undefined,
      };

      // Strip undefined
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      // Hit the actual backend route: POST /api/links
      const response = await api.post('/links', payload);

      const newLink = response.data;

      toast.success('Link encrypted & armed.');

      // Reset form
      setForm({
        url: '',
        slug: '',
        title: '',
        password: '',
        isOneTime: false,
        maxClicks: 0,
        expiresAt: '',
        showPreview: false,
        collection: 'General',
        scheduleStart: '',
      });

      if (onSuccess) onSuccess(newLink);
    } catch (error) {
      console.error('Link creation error:', error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to create link';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
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

            <Input
              label="Creator Name (Optional)"
              placeholder="Your name or team"
              value={form.creatorName}
              onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
              icon={<User className="w-4 h-4" />}
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
                    onChange={(e) =>
                      setForm({ ...form, collection: e.target.value })
                    }
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

              {/* One-time toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Burn after reading (1 view)
                </span>
                <input
                  type="checkbox"
                  className="accent-emerald-500 w-4 h-4"
                  checked={form.isOneTime}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isOneTime: e.target.checked,
                      maxClicks: e.target.checked ? 1 : 0,
                    })
                  }
                />
              </div>

              {/* Multi-use limit */}
              {!form.isOneTime && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 uppercase">
                    Max Access Count
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm"
                    placeholder="e.g. 5 (0 for unlimited)"
                    value={form.maxClicks}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxClicks: parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                </div>
              )}

              {/* Expiry date */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase">
                  Self-Destruct Date
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="datetime-local"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-10 py-2 text-white text-sm [&::-webkit-calendar-picker-indicator]:invert"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm({ ...form, expiresAt: e.target.value })
                    }
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
            <div
              className="p-4 border border-slate-800 rounded-lg flex items-start gap-3 bg-slate-900/30 hover:border-emerald-500/50 transition-colors cursor-pointer"
              onClick={() =>
                setForm({ ...form, showPreview: !form.showPreview })
              }
            >
              <div
                className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${
                  form.showPreview
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-600'
                }`}
              >
                {form.showPreview && (
                  <Eye className="w-3 h-3 text-slate-950" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">
                  Safe Preview Mode
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Show a &quot;Proceed with Caution&quot; page before
                  redirecting. Useful for warning users about sensitive
                  content.
                </p>
              </div>
            </div>

            {/* Scheduled Activation */}
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase">
                Scheduled Activation
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="datetime-local"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-10 py-2 text-white text-sm [&::-webkit-calendar-picker-indicator]:invert"
                  value={form.scheduleStart}
                  onChange={(e) =>
                    setForm({ ...form, scheduleStart: e.target.value })
                  }
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Link will remain a &quot;404&quot; until this time.
              </p>
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
