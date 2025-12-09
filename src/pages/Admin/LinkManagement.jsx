// src/pages/Admin/LinkManagement.jsx
import React, { useEffect, useState } from 'react';
import { Search, Filter, Trash2, ShieldOff, RefreshCcw, Shield } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active: 'bg-emerald-500/10 text-emerald-400',
  expired: 'bg-slate-500/10 text-slate-300',
  blocked: 'bg-red-500/10 text-red-400',
};

const LinkManagement = () => {
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // fetch links from backend
  const fetchLinks = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    const nextSearch = opts.search ?? search;
    const nextStatus = opts.status ?? statusFilter;

    setLoading(true);
    try {
      const res = await api.get('/admin/links', {
        params: {
          search: nextSearch,
          status: nextStatus || undefined,
          page: nextPage,
          limit: 20,
        },
      });

      console.log('ADMIN LINKS RESPONSE:', res.data);
      const data = res.data;

      let list = [];
      let totalCount = 0;
      let totalPages = 1;
      let currentPage = nextPage || 1;

      if (Array.isArray(data)) {
        list = data;
        totalCount = data.length;
        totalPages = 1;
        currentPage = 1;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.links)) list = data.links;
        else if (Array.isArray(data.items)) list = data.items;
        else if (Array.isArray(data.data)) list = data.data;
        else list = [];

        if (typeof data.totalLinks === 'number') totalCount = data.totalLinks;
        else if (typeof data.total === 'number') totalCount = data.total;
        else totalCount = list.length;

        if (typeof data.totalPages === 'number') totalPages = data.totalPages;
        else if (typeof data.pages === 'number') totalPages = data.pages;
        else totalPages = 1;

        if (typeof data.page === 'number') currentPage = data.page;
      }

      setLinks(list);
      setTotal(totalCount);
      setPages(totalPages || 1);
      setPage(currentPage || 1);

      if (opts.search !== undefined) setSearch(nextSearch);
      if (opts.status !== undefined) setStatusFilter(nextStatus);
    } catch (err) {
      console.error('Admin links fetch error:', err);
      toast.error(
        err.response?.data?.message || 'Failed to load links'
      );
      setLinks([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLinks({ page: 1, search });
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    fetchLinks({ page: 1, status: value });
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await api.patch(`/admin/links/${id}`, {
        status: newStatus,
      });
      setLinks((prev) =>
        prev.map((l) => (l._id === id ? res.data : l))
      );
      toast.success(`Link marked as ${newStatus}`);
    } catch (err) {
      console.error('Update status error:', err);
      toast.error(
        err.response?.data?.message || 'Failed to update status'
      );
    }
  };

  const deleteLink = async (id) => {
    if (!window.confirm('Delete this link permanently?')) return;
    try {
      await api.delete(`/admin/links/${id}`);
      setLinks((prev) => prev.filter((l) => l._id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success('Link deleted');
    } catch (err) {
      console.error('Delete link error:', err);
      toast.error(
        err.response?.data?.message || 'Failed to delete link'
      );
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  const formatClicks = (link) =>
    typeof link.clicks === 'number' ? link.clicks : 0;

  const onPrevPage = () => {
    if (page > 1) fetchLinks({ page: page - 1 });
  };

  const onNextPage = () => {
    if (page < pages) fetchLinks({ page: page + 1 });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Link Management
          </h1>
          <p className="text-lg text-slate-300">
            Search, audit, and control all secure endpoints
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLinks({ page })}
          disabled={loading}
          className="w-fit"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <div className="absolute -top-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl\"></div>
      </div>

      {/* Filters */}
      <Card className="bg-linear-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/50">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row gap-4 items-center justify-between"
        >
          <div className="flex-1 w-full flex items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                placeholder="Search by slug, title, or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                className="bg-white/5 border border-slate-200/10 rounded-md pl-9 pr-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <Button type="submit" size="sm" disabled={loading}>
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50 hover:border-slate-700 transition-all duration-300">
        <div className="flex items-center justify-between mb-4 p-6 pb-0">
          <div className="text-sm text-slate-400">
            Total links:{' '}
            <span className="text-slate-100 font-semibold">
              {total}
            </span>
          </div>
          <div className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
            Page {page} of {pages}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-t border-slate-700/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Destination</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Clicks</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Created</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-slate-500 text-sm"
                  >
                    Loading links…
                  </td>
                </tr>
              )}

              {!loading && links.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-slate-500 text-sm"
                  >
                    No links found. Try adjusting your filters.
                  </td>
                </tr>
              )}

              {!loading &&
                links.map((link) => (
                  <tr key={link._id} className="border-t border-slate-800">
                    <td className="px-4 py-2 font-mono text-xs text-emerald-400">
                      /{link.slug}
                    </td>
                    <td className="px-4 py-2 max-w-md truncate text-sm text-slate-200">
                      {link.title || link.targetUrl}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={
                          'inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ' +
                          (STATUS_COLORS[link.status] ||
                            'bg-slate-700 text-slate-100')
                        }
                      >
                        {link.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center text-sm">
                      {formatClicks(link)}
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-slate-400">
                      {formatDate(link.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {link.status !== 'blocked' ? (
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                            onClick={() =>
                              updateStatus(link._id, 'blocked')
                            }
                          >
                            <ShieldOff className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() =>
                              updateStatus(link._id, 'active')
                            }
                          >
                            <ShieldOff className="w-4 h-4 rotate-180" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="icon"
                          className="border-slate-600 text-slate-300 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => deleteLink(link._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevPage}
              disabled={page === 1 || loading}
            >
              Prev
            </Button>
            <span>
              Page {page} of {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={page === pages || loading}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LinkManagement;
