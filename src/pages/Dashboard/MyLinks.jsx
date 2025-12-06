import React, { useState, useEffect } from 'react';
import {
  Plus,
  ExternalLink,
  Copy,
  QrCode,
  Lock,
  Flame,
  Eye,
  FolderOpen,
  Star,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CreateLinkForm } from '../../components/links/CreateLinkForm';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { useClipboard } from '../../hooks/useClipboard';
import { QRPopup } from '../../components/links/QRPopup';
import api from '../../services/api';
import { APP_BASE_URL } from '../../config/appUrl'; // uses env + origin

const StatusBadges = ({ link }) => {
  const badges = [];
  const now = new Date();

  const isExpired =
    link.status === 'expired' ||
    (link.expiresAt && new Date(link.expiresAt) < now);

  if (isExpired) {
    badges.push(
      <span
        key="expired"
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-300 border border-red-500/40"
      >
        Expired
      </span>,
    );
  }

  if (link.scheduleStart && new Date(link.scheduleStart) > now) {
    badges.push(
      <span
        key="scheduled"
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/40"
      >
        Scheduled
      </span>,
    );
  }

  if (link.isOneTime || (link.maxClicks && link.maxClicks > 0)) {
    badges.push(
      <span
        key="burn"
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/10 text-orange-300 border border-orange-500/40"
      >
        Burn-on-open
      </span>,
    );
  }

  if (link.password) {
    badges.push(
      <span
        key="locked"
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-200 border border-slate-500/40"
      >
        Locked
      </span>,
    );
  }

  if (link.showPreview) {
    badges.push(
      <span
        key="preview"
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
      >
        Preview
      </span>,
    );
  }

  if (badges.length === 0) return null;

  return <div className="flex flex-wrap gap-1 mt-1">{badges}</div>;
};

// Per-link spy-style avatar (no auth needed)
const getLinkAvatar = (link) => {
  const seed = encodeURIComponent(
    link.title || link.slug || link.targetUrl || 'Deadman Agent',
  );
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
};

// Build the public URL for a slug safely
const buildLinkUrl = (slug) => {
  const base = APP_BASE_URL || window.location.origin;
  const cleanBase = base.replace(/\/+$/, '');
  return `${cleanBase}/${slug}`;
};

const MyLinks = () => {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [qrLink, setQrLink] = useState(null);
  const [filter, setFilter] = useState('All');

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const { copy } = useClipboard();

  // Directly fetch from backend instead of useFetch hook
  const loadLinks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/links');
      // backend returns an array of link docs
      setLinks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load links', err);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleLinkCreated = () => {
    setCreateOpen(false);
    // re-fetch list after creating a link
    loadLinks();
  };

  // Apply collection filter
  const filteredLinks = Array.isArray(links)
    ? links.filter((link) => {
        if (filter === 'All') return true;
        const collection =
          link.collectionName || link.collection || 'General';
        return collection === filter;
      })
    : [];

  const columns = [
    {
      header: 'Identity',
      className: 'w-1/3',
      cell: (row) => (
        <div className="flex items-center gap-3">
          {/* Favorite button (future) */}
          <button
            className="text-slate-600 hover:text-yellow-400 transition-colors"
            title="Mark as Favorite"
          >
            <Star className="w-4 h-4" />
          </button>

          {/* Link avatar */}
          <img
            src={getLinkAvatar(row)}
            alt={row.title || 'Link avatar'}
            className="w-9 h-9 rounded-full border border-slate-700 bg-slate-800 object-cover shrink-0"
          />

          {/* Icon + title + url + badges */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-700">
                {row.status === 'expired' ? (
                  <Flame className="w-5 h-5 text-red-500" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-slate-200 truncate">
                  {row.title || 'Untitled Operation'}
                </div>
                <div className="text-xs text-slate-500 truncate max-w-[200px]">
                  {row.targetUrl}
                </div>
              </div>
            </div>
            <StatusBadges link={row} />
          </div>
        </div>
      ),
    },
    {
      header: 'Security',
      cell: (row) => (
        <div className="flex gap-2">
          {row.password && (
            <Lock
              className="w-4 h-4 text-emerald-500"
              title="Password Protected"
            />
          )}
          {(row.isOneTime || (row.maxClicks && row.maxClicks > 0)) && (
            <Flame
              className="w-4 h-4 text-orange-500"
              title="Self-Destruct / Limited Clicks"
            />
          )}
          {row.showPreview && (
            <Eye
              className="w-4 h-4 text-blue-500"
              title="Safe Preview Enabled"
            />
          )}
        </div>
      ),
    },
    {
      header: 'Short Link',
      cell: (row) => {
        const url = buildLinkUrl(row.slug);

        return (
          <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-lg border border-slate-800 w-fit">
            <span className="font-mono text-[11px] text-emerald-400 pl-1">
              /{row.slug}
            </span>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                copy(url);
              }}
              className="hover:text-white text-slate-500"
              title="Copy Link"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQrLink(url);
              }}
              className="hover:text-white text-slate-500"
              title="Get QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (row) => {
        const now = new Date();
        const isExpired =
          row.status === 'expired' ||
          (row.expiresAt && new Date(row.expiresAt) < now);
        const isScheduled =
          row.scheduleStart && new Date(row.scheduleStart) > now;

        let label = 'Active';
        if (isExpired) label = 'Expired';
        else if (isScheduled) label = 'Scheduled';

        return <Badge variant={isExpired ? 'danger' : 'success'}>{label}</Badge>;
      },
    },
    {
      header: 'Clicks',
      accessor: 'clicks',
      className: 'text-center font-mono text-slate-400',
    },
    {
      header: 'Created',
      cell: (row) => (
        <span className="text-slate-500 text-xs">
          {row.createdAt
            ? new Date(row.createdAt).toLocaleDateString()
            : '--'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-emerald-500" />
            Mission Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage, track, and destroy your secure endpoints.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              className="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 appearance-none h-10"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Collections</option>
              <option value="General">General</option>
              <option value="Intel">Intel</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="w-full md:w-auto px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Link
          </Button>
        </div>
      </div>

      <Table columns={columns} data={filteredLinks} isLoading={loading} />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Secure Link"
      >
        <CreateLinkForm onSuccess={handleLinkCreated} />
      </Modal>

      <QRPopup
        isOpen={!!qrLink}
        onClose={() => setQrLink(null)}
        url={qrLink || ''}
      />
    </div>
  );
};

export default MyLinks;
