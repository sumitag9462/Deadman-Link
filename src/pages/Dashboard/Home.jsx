import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { CreateLinkForm } from '../../components/links/CreateLinkForm';
import { APP_BASE_URL } from '../../config/appUrl'; // 🔥 use app base url
import api from '../../services/api';

const DashboardHome = () => {
  const navigate = useNavigate();

  // store last created short URL for display + copy
  const [shortUrl, setShortUrl] = useState('');

  // basic stats for overview cards
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    clicks: 0,
    loading: true,
  });

  const handleLinkCreated = (link) => {
    // link comes from CreateLinkForm onSuccess
    const generatedShort = `${APP_BASE_URL}/${link.slug}`; // 🔥 not localhost
    setShortUrl(generatedShort);
  };

  const handleCopyShortUrl = async () => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast.success('Short link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy. You can copy it manually.');
    }
  };

  // load link stats for overview
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStats((s) => ({ ...s, loading: true }));
        const res = await api.get('/links');
        const links = Array.isArray(res.data) ? res.data : [];

        const total = links.length;
        const active = links.filter((l) => l.status !== 'expired').length;
        const clicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);

        setStats({ total, active, clicks, loading: false });
      } catch (err) {
        console.error('Failed to load stats', err);
        setStats({ total: 0, active: 0, clicks: 0, loading: false });
      }
    };

    loadStats();
  }, []);

  return (
    <div className="h-full w-full space-y-10">
      <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>

      {/* --------------------------- */}
      {/*   Unified Link Creator      */}
      {/* --------------------------- */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">
          Create Deadman Link
        </h2>

        {/* Single source of truth for link creation */}
        <CreateLinkForm onSuccess={handleLinkCreated} />

        {/* Show result only when we have a short URL */}
        {shortUrl && (
          <div className="mt-5 border border-slate-700 rounded-lg p-4 bg-slate-900/70">
            <p className="text-slate-400 text-xs uppercase tracking-wide">
              Your short link
            </p>
            <div className="mt-2 flex flex-col md:flex-row gap-3 md:items-center">
              <span className="break-all text-sm bg-slate-800 px-3 py-2 rounded-md border border-slate-700">
                {shortUrl}
              </span>
              <Button
                type="button"
                onClick={handleCopyShortUrl}
                className="md:w-auto w-full"
              >
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Links', value: stats.loading ? '…' : stats.total },
          { label: 'Active Links', value: stats.loading ? '…' : stats.active },
          {
            label: 'Total Clicks',
            value: stats.loading ? '…' : stats.clicks.toLocaleString(),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg"
          >
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
              {item.label}
            </p>
            <p className="text-3xl font-bold text-white mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Empty State Action */}
      {stats.loading || stats.total === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center shadow-lg">
          <h3 className="text-white text-xl font-semibold mb-2">
            {stats.loading ? 'Loading links...' : 'No links created yet'}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {stats.loading
              ? 'Fetching your link activity.'
              : 'Create your first deadman link to start tracking.'}
          </p>
          <div className="max-w-xs mx-auto">
            <Button onClick={() => navigate('/dashboard/links')}>
              View All Links
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardHome;
