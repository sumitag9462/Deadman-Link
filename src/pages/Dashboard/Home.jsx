import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { CreateLinkForm } from '../../components/links/CreateLinkForm';
import { APP_BASE_URL } from '../../config/appUrl'; // 🔥 use app base url

const DashboardHome = () => {
  const navigate = useNavigate();

  // store last created short URL for display + copy
  const [shortUrl, setShortUrl] = useState('');

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
        {['Total Links', 'Active Links', 'Total Clicks'].map((item) => (
          <div
            key={item}
            className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg"
          >
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
              {item}
            </p>
            <p className="text-3xl font-bold text-white mt-2">0</p>
          </div>
        ))}
      </div>

      {/* Empty State Action */}
      <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center shadow-lg">
        <h3 className="text-white text-xl font-semibold mb-2">
          No links created yet
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Create your first deadman link to start tracking.
        </p>
        <div className="max-w-xs mx-auto">
          <Button onClick={() => navigate('/dashboard/links')}>
            View All Links
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
