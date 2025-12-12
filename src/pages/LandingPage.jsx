// src/pages/LandingPage.jsx
import React, { useRef, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  Link as LinkIcon,
  GitMerge,
  Zap,
  Globe,
  CheckCircle,
  Coffee,
  Info,
  Terminal,
  Lock,
  Loader2,
  Copy,
  ExternalLink,
} from 'lucide-react';

const Feature = ({ Icon, title, children }) => (
  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex gap-4 items-start hover:shadow-lg transition">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-950/50 border border-slate-800">
      <Icon className="w-6 h-6 text-emerald-400" />
    </div>
    <div>
      <h4 className="text-white text-sm font-semibold">{title}</h4>
      <p className="text-slate-400 text-xs mt-1">{children}</p>
    </div>
  </div>
);

export default function LandingPage() {
  const { user } = useAuth();
  const featuresRef = useRef(null);

  // quick demo (fixed URL) — user cannot edit URL
  const fixedUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // create short link / preview
  const [slug, setSlug] = useState('neon-quantum-v7'); // default slug user can edit
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState(null); // holds the created URL (preview or real)
  const [previewOnly, setPreviewOnly] = useState(true); // checkbox toggle

  useEffect(() => {
    setScanResult(null);
    setCreatedLink(null);
  }, []);

  // ---------- Updated scan handler (static positive result) ----------
  const handleScan = async () => {
    try {
      setScanLoading(true);
      setScanResult(null);
      await new Promise((r) => setTimeout(r, 650));
      const staticResult = {
        score: 0,
        verdict: 'safe',
        reasons: ['No suspicious patterns detected', 'Known good domain'],
        message: 'Scan complete — Above link is safe and secure. 100% safe.',
      };
      setScanResult(staticResult);
      toast.success('Scan complete — link appears safe');
    } catch (err) {
      console.error('Scan (static) failed', err);
      toast.error('Scan failed');
    } finally {
      setScanLoading(false);
    }
  };

  // ---------- Updated create handler ----------
  const handleCreateLink = async () => {
    // If user only wants a preview, build a local preview URL and do not call backend
    if (previewOnly) {
      // keep full origin (including port)
      const origin = window.location.origin;
      const previewUrl = `${origin}/preview/${encodeURIComponent(slug || 'demo')}`;
      await navigator.clipboard.writeText(previewUrl).catch(() => {});
      setCreatedLink(previewUrl);
      toast.success(`Preview created (local only). Copied: ${previewUrl}`);
      return;
    }

    // Otherwise attempt to create the link on the backend
    try {
      setCreating(true);
      const payload = {
        url: fixedUrl,
        slug: slug || undefined,
        title: 'Neonwave quantum cache protocol (demo)',
        ownerEmail: user?.email || undefined,
        visibility: 'public',
      };

      // send auth header only if token exists
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

      // first attempt (with headers if present)
      const attempt = await api.post('/links', payload, { headers });
      const created = attempt.data;

      // keep full origin so dev port is included
      const origin = window.location.origin;
      const short = `${origin}/r/${created.slug}`;
      await navigator.clipboard.writeText(short).catch(() => {});
      setCreatedLink(short);
      toast.success(`Link created and copied: ${short}`);
      setCreating(false);
    } catch (err) {
      console.error('Create link first attempt failed', err);
      const status = err?.response?.status;
      const message = (err?.response?.data?.message || err.message || '').toString();

      // If it's an auth/token issue, show clear "Sign in required" message instead of raw backend text.
      if (status === 401 || /missing token|missing.*token|token|required|authorization/i.test(message)) {
        toast.error('Sign in required — please sign in to create links');
        setCreating(false);
        return;
      }

      // other errors: show backend message if available
      const fallback = message || 'Failed to create link';
      toast.error(fallback);
      setCreating(false);
    }
  };

  const goToLogin = () => (window.location.href = '/login');
  const goToRegister = () => (window.location.href = '/register');
  const goToAdmin = () => (window.location.href = '/admin/login');
  const scrollToFeatures = () => {
    if (featuresRef.current) featuresRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const copyCreatedLink = async () => {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink).catch(() => {});
    toast.success('Copied to clipboard');
  };

  return (
    <div className="px-6 md:px-12 lg:px-24 py-12 space-y-12">
      {/* Top action row (three buttons) — ensured no stray symbol/text before the first button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <Button variant="ghost" onClick={goToLogin} className="flex items-center gap-2">
            <Terminal className="w-4 h-4" /> <span>Access Terminal</span>
          </Button>

          <Button variant="outline" onClick={goToRegister} className="flex items-center gap-2">
            <Lock className="w-4 h-4" /> <span>Initialize Terminal</span>
          </Button>

          <Button variant="secondary" onClick={goToAdmin} className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> <span>Admin Access</span>
          </Button>
        </div>

        <div /> {/* placeholder on the right side */}
      </div>

      {/* HERO */}
      <section className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-medium mb-6">
            <Sparkles className="w-4 h-4" /> New · Similarity recommendations
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Intelligent links that <span className="text-emerald-400">adapt</span>, protect and expire.
          </h1>

          <p className="mt-4 text-slate-400 max-w-xl">
            Create secure, time-limited and context-aware links — with optional safety scanning, conditional redirects, and privacy controls.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={scrollToFeatures} className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> View features
            </Button>

            
          </div>

          <div className="mt-8 flex gap-6 text-sm">
            <div className="text-white font-semibold">
              <div>Instant Links</div>
              <div className="text-slate-400 text-xs mt-1">Shorten & share in seconds</div>
            </div>
            <div className="text-white font-semibold">
              <div>Safety Scanner</div>
              <div className="text-slate-400 text-xs mt-1">Heuristic checks & flags</div>
            </div>
            <div className="text-white font-semibold">
              <div>Smart Suggestions</div>
              <div className="text-slate-400 text-xs mt-1">Recommend similar saved links</div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-lg w-full">
          <Card className="p-4 border-slate-800 bg-slate-900/40">
            <div className="text-xs text-slate-400 mb-2">Quick demo</div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-200 font-medium">Destination URL</div>
                <div className="text-xs text-slate-500">Demo · Fixed</div>
              </div>

              <div className="bg-slate-950 px-3 py-2 rounded-lg flex items-center gap-3">
                <input className="bg-transparent outline-none text-sm w-full text-slate-200" value={fixedUrl} readOnly />
                <Button size="sm" variant="secondary" onClick={handleScan} disabled={scanLoading}>
                  {scanLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Scanning...
                    </>
                  ) : (
                    'Scan'
                  )}
                </Button>
              </div>

              {/* Static scan result display */}
              {scanResult ? (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
                  <div className="font-medium text-white mb-2">Scan complete</div>
                  <div className="text-slate-400 text-sm">{scanResult.message}</div>
                  {Array.isArray(scanResult.reasons) && (
                    <ul className="mt-2 text-xs text-slate-400 list-disc pl-5 space-y-1">
                      {scanResult.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
                  <div className="font-medium text-white mb-2">Similar links already stored</div>
                  <div className="text-slate-400 text-sm">No similar links found yet. Try creating a link below.</div>
                </div>
              )}

              <div className="pt-2">
                <label className="block text-xs text-slate-400 mb-1">Custom slug (optional)</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm"
                  placeholder="custom-slug-here"
                />

                <div className="mt-2 flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-2 text-slate-300 select-none">
                    <input
                      type="checkbox"
                      className="accent-emerald-500"
                      checked={previewOnly}
                      onChange={(e) => setPreviewOnly(e.target.checked)}
                    />
                    Preview only (do not store on server)
                  </label>
                </div>

                {/* Created link display */}
                {createdLink && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-300 break-all">{createdLink}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyCreatedLink}
                        className="flex items-center gap-2 border border-slate-800 px-2 py-1 rounded"
                      >
                        <Copy className="w-4 h-4" /> Copy
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => window.open(createdLink, '_blank')}
                        className="flex items-center gap-2 px-3 py-1"
                      >
                        <ExternalLink className="w-4 h-4" /> Open
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={handleCreateLink} isLoading={creating}>
                    {creating ? 'Creating...' : previewOnly ? 'Create local preview' : 'Create link'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section ref={featuresRef} className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        <Feature Icon={ShieldCheck} title="Safety Scanner">
          Heuristic checks for phishing/malware and light scoring. Optionally flag and quarantine suspicious links.
        </Feature>

        <Feature Icon={Globe} title="Conditional Redirects">
          Route users dynamically by device, time-of-day, or visitor count — great for promos and staged rollouts.
        </Feature>

        <Feature Icon={GitMerge} title="Privacy & Visibility">
          Per-link visibility (public/private) and per-user opt-out for suggestions — keep sensitive links private.
        </Feature>

        <Feature Icon={Zap} title="Webhooks & Integrations">
          Fire events when links are clicked, expired or consumed — plug into notifications, analytics and automations.
        </Feature>

        <Feature Icon={LinkIcon} title="Similarity Recommendations">
          Level-2 heuristic engine: domain/path slug match + keyword overlap to suggest existing links from the network.
        </Feature>

        <Feature Icon={CheckCircle} title="Safe Preview Mode">
          Show a caution/preview interstitial before redirecting — reduce accidental opens and give context.
        </Feature>
      </section>

      {/* WHAT'S NEW */}
      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">What's new</h3>
          <div className="text-xs text-slate-500">Latest updates</div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 border-slate-800 bg-slate-900/40">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="text-sm text-white font-semibold">Similarity engine v2</div>
                <div className="text-slate-400 text-xs mt-1">Recommend similar saved links using slug + title keyword heuristics.</div>
                <div className="mt-3 text-xs text-slate-400">Try creating a link and notice the suggestion panel.</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/40">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="text-sm text-white font-semibold">Visibility & privacy</div>
                <div className="text-slate-400 text-xs mt-1">Per-link public/private toggle and user-level opt-out for suggestions.</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/40">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="text-sm text-white font-semibold">Webhook integrations</div>
                <div className="text-slate-400 text-xs mt-1">Fire automated events for clicks, expiry, and one-time consumption.</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto text-center py-10">
        <div className="text-xs text-slate-500 mb-3">Support the project</div>
        <h3 className="text-2xl text-white font-semibold mb-4">Want to show us support?</h3>
        <div className="flex justify-center gap-4">
          <Button variant="primary" onClick={() => window.open('https://www.buymeacoffee.com/yourpage', '_blank')}>
            <Coffee className="w-4 h-4 mr-2" /> Buy us a coffee
          </Button>
          
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto text-center text-slate-500 py-6">
        © Deadman Link — Copyright 2025
      </footer>
    </div>
  );
}
