// src/components/links/CreateLinkForm.jsx
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
  ShieldAlert,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export const CreateLinkForm = ({ onSuccess }) => {
  const { user } = useAuth();
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

  // 🔁 Dynamic rules state
  const [conditionalRedirectEnabled, setConditionalRedirectEnabled] =
    useState(false);

  const [deviceRules, setDeviceRules] = useState({
    mobileUrl: '',
    desktopUrl: '',
    tabletUrl: '',
    botUrl: '',
  });

  const [weekdayUrl, setWeekdayUrl] = useState('');
  const [weekendUrl, setWeekendUrl] = useState('');

  const [timeRule, setTimeRule] = useState({
    startHour: '',
    endHour: '',
    url: '',
  });

  const [clickRule, setClickRule] = useState({
    minClicks: '',
    maxClicks: '',
    url: '',
  });

  // 🌐 Webhook state
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookTriggers, setWebhookTriggers] = useState({
    onFirstClick: false,
    onExpiry: false,
    onOneTimeComplete: false,
  });

  // 🧠 Safety scanner state
  // safety: { score, verdict, reasons, flagRecommended, hostname }
  const [safety, setSafety] = useState(null);
  const [safetyLoading, setSafetyLoading] = useState(false);

  const handleScanSafety = async () => {
    const url = form.url.trim();

    if (!url) {
      toast.error('Enter a destination URL first');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('URL must start with http:// or https://');
      return;
    }

    try {
      setSafetyLoading(true);
      // clear previous result while scanning
      setSafety(null);

      const res = await api.post('/security/scan-url', { url });
      // Optional: debug what backend is giving
      // console.log('Safety scan result:', res.data);
      setSafety(res.data);
    } catch (err) {
      console.error('Safety scan error:', err);
      toast.error(
        err.response?.data?.message || 'Failed to scan link safety'
      );
    } finally {
      setSafetyLoading(false);
    }
  };

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

      // 🧠 build conditionalRedirect from dynamic rules state
      let conditionalRedirect;
      if (conditionalRedirectEnabled) {
        conditionalRedirect = {
          enabled: true,
          deviceRules: {
            mobileUrl: deviceRules.mobileUrl || null,
            desktopUrl: deviceRules.desktopUrl || null,
            tabletUrl: deviceRules.tabletUrl || null,
            botUrl: deviceRules.botUrl || null,
          },
          dayTypeRules: {
            weekdayUrl: weekdayUrl || null,
            weekendUrl: weekendUrl || null,
          },
          timeOfDayRules:
            timeRule.url &&
            timeRule.startHour !== '' &&
            timeRule.endHour !== ''
              ? [
                  {
                    startHour: Number(timeRule.startHour),
                    endHour: Number(timeRule.endHour),
                    url: timeRule.url,
                  },
                ]
              : [],
          clickRules: clickRule.url
            ? [
                {
                  minClicks: clickRule.minClicks
                    ? Number(clickRule.minClicks)
                    : 0,
                  maxClicks: clickRule.maxClicks
                    ? Number(clickRule.maxClicks)
                    : null,
                  url: clickRule.url,
                },
              ]
            : [],
        };
      }

      // 🌐 build webhookConfig if enabled
      let webhookConfig;
      if (webhookEnabled && webhookUrl.trim()) {
        webhookConfig = {
          enabled: true,
          url: webhookUrl.trim(),
          secret: webhookSecret || null,
          triggers: {
            onFirstClick: webhookTriggers.onFirstClick,
            onExpiry: webhookTriggers.onExpiry,
            onOneTimeComplete: webhookTriggers.onOneTimeComplete,
          },
        };
      }

      // Payload that matches backend POST /api/links
      const payload = {
        url: form.url, // backend expects `url`
        slug: form.slug || undefined,
        title: form.title || form.url,
        creatorName:
          form.creatorName || user?.name || user?.email || 'Anonymous',
        password: form.password || undefined,
        isOneTime: form.isOneTime,
        maxClicks: normalizedMaxClicks,
        expiresAt: form.expiresAt || undefined,
        showPreview: form.showPreview,
        collection: form.collection,
        scheduleStart: form.scheduleStart || undefined,
        // tie link to the logged-in user
        ownerEmail: user?.email || null,
        ...(conditionalRedirect ? { conditionalRedirect } : {}),
        ...(webhookConfig ? { webhookConfig } : {}),
      };

      // Strip undefined so we don't send junk
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      // Hit the actual backend route: POST /api/links
      const response = await api.post('/links', payload);

      const newLink = response.data;

      toast.success('Link encrypted & armed.');

      // Reset form (keep collection default)
      setForm({
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

      // Reset dynamic rules
      setConditionalRedirectEnabled(false);
      setDeviceRules({
        mobileUrl: '',
        desktopUrl: '',
        tabletUrl: '',
        botUrl: '',
      });
      setWeekdayUrl('');
      setWeekendUrl('');
      setTimeRule({
        startHour: '',
        endHour: '',
        url: '',
      });
      setClickRule({
        minClicks: '',
        maxClicks: '',
        url: '',
      });

      // Reset webhook
      setWebhookEnabled(false);
      setWebhookUrl('');
      setWebhookSecret('');
      setWebhookTriggers({
        onFirstClick: false,
        onExpiry: false,
        onOneTimeComplete: false,
      });

      // Reset safety
      setSafety(null);

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

  // 🧠 Decide badge style + text based on safety score
  // We treat score as 0–100 coming from backend and map to bands:
  // 0         → NO OBVIOUS RISK (0%)
  // 1–29      → LIGHT RISK (20%)
  // 30–59     → MODERATE RISK (50%)
  // 60–84     → HIGH RISK (75%)
  // 85+       → OBVIOUSLY RISKY (100%)
  const renderSafetyBadge = () => {
    if (!safety) return null;

    const hasReasons =
      Array.isArray(safety.reasons) && safety.reasons.length > 0;

    const rawScore =
      typeof safety.score === 'number' && !Number.isNaN(safety.score)
        ? safety.score
        : 0;

    let label = '';
    let percentLabel = '0%';
    let badgeClasses =
      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border';
    let Icon = ShieldCheck;

    if (!hasReasons && rawScore === 0) {
      // totally clean
      badgeClasses +=
        ' bg-emerald-500/10 text-emerald-300 border-emerald-500/60';
      label = 'NO OBVIOUS RISK';
      percentLabel = '0%';
    } else {
      // some risk present – map raw score into buckets
      Icon = ShieldAlert;

      if (rawScore >= 85) {
        badgeClasses +=
          ' bg-red-600/15 text-red-300 border-red-500/70';
        label = 'OBVIOUSLY RISKY';
        percentLabel = '100%';
      } else if (rawScore >= 60) {
        badgeClasses +=
          ' bg-red-500/10 text-red-300 border-red-500/60';
        label = 'HIGH RISK';
        percentLabel = '75%';
      } else if (rawScore >= 30) {
        badgeClasses +=
          ' bg-amber-500/10 text-amber-300 border-amber-500/60';
        label = 'MODERATE RISK';
        percentLabel = '50%';
      } else {
        badgeClasses +=
          ' bg-yellow-500/10 text-yellow-300 border-yellow-500/60';
        label = 'LIGHT RISK';
        percentLabel = '20%';
      }
    }

    return (
      <span className={badgeClasses}>
        <Icon className="w-3 h-3" />
        <span>{label}</span>
        <span className="opacity-80 ml-1">
          · score {percentLabel}
        </span>
      </span>
    );
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
            <div>
              <Input
                label="Destination URL"
                placeholder="https://topsecret.com/payload"
                value={form.url}
                onChange={(e) => {
                  setForm({ ...form, url: e.target.value });
                  // clear previous safety result when URL changes
                  setSafety(null);
                }}
                required
                icon={<LinkIcon className="w-4 h-4" />}
              />

              {/* Safety scan actions + badge */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleScanSafety}
                  disabled={safetyLoading}
                >
                  {safetyLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Scanning…
                    </>
                  ) : (
                    'Scan link safety'
                  )}
                </Button>

                {renderSafetyBadge()}
              </div>

              {/* Safety reasons list */}
              {safety &&
                Array.isArray(safety.reasons) &&
                safety.reasons.length > 0 && (
                  <ul className="mt-2 text-xs text-slate-400 list-disc pl-5 space-y-1">
                    {safety.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                )}
            </div>

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
              onChange={(e) =>
                setForm({ ...form, creatorName: e.target.value })
              }
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
                  Show a &quot;Proceed with Caution&quot; page before redirecting.
                  Useful for warning users about sensitive content.
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

            {/* 🔥 Dynamic redirect rules */}
            <section className="mt-2 border border-slate-800 rounded-xl bg-slate-900">
              <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Dynamic Redirect Rules
                  </h3>
                  <p className="text-xs text-slate-400">
                    Optionally change destination based on device, time, day or
                    click count.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <span>Enable</span>
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={conditionalRedirectEnabled}
                    onChange={(e) =>
                      setConditionalRedirectEnabled(e.target.checked)
                    }
                  />
                </label>
              </header>

              {conditionalRedirectEnabled && (
                <div className="px-4 py-4 space-y-5 text-xs md:text-sm">
                  {/* Device rules */}
                  <div className="space-y-2">
                    <p className="font-medium text-slate-200">
                      Device-based redirects
                    </p>
                    <p className="text-slate-400 text-xs">
                      Send mobile / desktop users to different landing pages.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Mobile URL
                        </label>
                        <input
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          placeholder="https://m.example.com"
                          value={deviceRules.mobileUrl}
                          onChange={(e) =>
                            setDeviceRules((prev) => ({
                              ...prev,
                              mobileUrl: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Desktop URL
                        </label>
                        <input
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          placeholder="https://example.com/desktop"
                          value={deviceRules.desktopUrl}
                          onChange={(e) =>
                            setDeviceRules((prev) => ({
                              ...prev,
                              desktopUrl: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Tablet URL
                        </label>
                        <input
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          placeholder="optional"
                          value={deviceRules.tabletUrl}
                          onChange={(e) =>
                            setDeviceRules((prev) => ({
                              ...prev,
                              tabletUrl: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Bot / crawler URL
                        </label>
                        <input
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          placeholder="optional"
                          value={deviceRules.botUrl}
                          onChange={(e) =>
                            setDeviceRules((prev) => ({
                              ...prev,
                              botUrl: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-800" />

                  {/* Day type rules */}
                  <div className="space-y-2">
                    <p className="font-medium text-slate-200">
                      Weekday / Weekend
                    </p>
                    <p className="text-slate-400 text-xs">
                      Different pages on workdays vs Saturdays/Sundays.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Weekday URL (Mon–Fri)
                        </label>
                        <input
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          placeholder="https://example.com/work"
                          value={weekdayUrl}
                          onChange={(e) => setWeekdayUrl(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Weekend URL (Sat–Sun)
                        </label>
                        <input
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          placeholder="https://example.com/chill"
                          value={weekendUrl}
                          onChange={(e) => setWeekendUrl(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-800" />

                  {/* Time of day rule */}
                  <div className="space-y-2">
                    <p className="font-medium text-slate-200">
                      Time-of-day redirect
                    </p>
                    <p className="text-slate-400 text-xs">
                      Optionally send users to a different URL during a specific
                      hour window.
                    </p>
                    <div className="grid md:grid-cols-[120px_120px_1fr] gap-3">
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Start hour (0–23)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          value={timeRule.startHour}
                          onChange={(e) =>
                            setTimeRule((prev) => ({
                              ...prev,
                              startHour: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          End hour (0–23)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          value={timeRule.endHour}
                          onChange={(e) =>
                            setTimeRule((prev) => ({
                              ...prev,
                              endHour: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Time window URL
                        </label>
                        <input
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          placeholder="https://example.com/night-mode"
                          value={timeRule.url}
                          onChange={(e) =>
                            setTimeRule((prev) => ({
                              ...prev,
                              url: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      If start &gt; end (e.g. 22 → 6), the rule wraps around
                      midnight.
                    </p>
                  </div>

                  <hr className="border-slate-800" />

                  {/* Click count rule */}
                  <div className="space-y-2">
                    <p className="font-medium text-slate-200">
                      Click-based redirect
                    </p>
                    <p className="text-slate-400 text-xs">
                      e.g. first 10 visitors see a special offer page.
                    </p>
                    <div className="grid md:grid-cols-[120px_120px_1fr] gap-3">
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Min clicks
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          value={clickRule.minClicks}
                          onChange={(e) =>
                            setClickRule((prev) => ({
                              ...prev,
                              minClicks: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Max clicks (optional)
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          value={clickRule.maxClicks}
                          onChange={(e) =>
                            setClickRule((prev) => ({
                              ...prev,
                              maxClicks: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[11px] uppercase text-slate-400">
                          Click range URL
                        </label>
                        <input
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          placeholder="https://example.com/early-bird"
                          value={clickRule.url}
                          onChange={(e) =>
                            setClickRule((prev) => ({
                              ...prev,
                              url: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 🌐 Webhook Integrations */}
            <section className="mt-3 border border-slate-800 rounded-xl bg-slate-900">
              <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Webhook Integrations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Call an external URL when this link is clicked or expires.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <span>Enable</span>
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={webhookEnabled}
                    onChange={(e) => setWebhookEnabled(e.target.checked)}
                  />
                </label>
              </header>

              {webhookEnabled && (
                <div className="px-4 py-4 space-y-4 text-xs md:text-sm">
                  <div className="space-y-2">
                    <label className="block mb-1 text-[11px] uppercase text-slate-400">
                      Webhook URL
                    </label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      placeholder="https://example.com/webhook-endpoint"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-500">
                      This URL will receive POST requests with JSON payloads
                      when selected events occur.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block mb-1 text-[11px] uppercase text-slate-400">
                      Secret (optional)
                    </label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      placeholder="Shared secret for verification"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-500">
                      Sent as{' '}
                      <code className="font-mono">x-deadman-secret</code>{' '}
                      header so your server can verify the request.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-slate-200">
                      Trigger on events
                    </p>
                    <div className="grid gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          className="accent-emerald-500"
                          checked={webhookTriggers.onFirstClick}
                          onChange={(e) =>
                            setWebhookTriggers((prev) => ({
                              ...prev,
                              onFirstClick: e.target.checked,
                            }))
                          }
                        />
                        <span>
                          First click{' '}
                          <span className="text-slate-500">
                            (fires only the first time this link is opened)
                          </span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          className="accent-emerald-500"
                          checked={webhookTriggers.onExpiry}
                          onChange={(e) =>
                            setWebhookTriggers((prev) => ({
                              ...prev,
                              onExpiry: e.target.checked,
                            }))
                          }
                        />
                        <span>
                          Expiry{' '}
                          <span className="text-slate-500">
                            (time-based or max-clicks expiry)
                          </span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          className="accent-emerald-500"
                          checked={webhookTriggers.onOneTimeComplete}
                          onChange={(e) =>
                            setWebhookTriggers((prev) => ({
                              ...prev,
                              onOneTimeComplete: e.target.checked,
                            }))
                          }
                        />
                        <span>
                          One-time link consumed{' '}
                          <span className="text-slate-500">
                            (for links with &quot;burn after reading&quot;)
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </section>
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
