// File: src/pages/Admin/LinkManagement.jsx
import React from 'react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Trash2, Flag, Eye, User } from 'lucide-react';

const LinkManagement = () => {
  // Mock Data: Includes avatar initials or icons
  const allLinks = [
    { _id: '1', title: 'Malware Dist', slug: 'free-money', targetUrl: 'http://evil.com', owner: 'User 99', avatar: 'U9', status: 'flagged', reports: 12 },
    { _id: '2', title: 'Project X', slug: 'proj-x', targetUrl: 'http://docs.google.com', owner: 'Agent 007', avatar: '007', status: 'active', reports: 0 },
    { _id: '3', title: 'Spam Link', slug: 'buy-now', targetUrl: 'http://spam.com', owner: 'Bot 22', avatar: null, status: 'blocked', reports: 55 },
  ];

  const columns = [
    { 
        header: "Identity", 
        cell: (row) => (
            <div className="flex items-center gap-3">
                {/* Creator Avatar Feature */}
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {row.avatar || <User className="w-4 h-4" />}
                </div>
                <div>
                    <div className="text-white font-medium">{row.owner}</div>
                    <div className="text-[10px] text-slate-500">ID: {row._id}</div>
                </div>
            </div>
        )
    },
    { 
        header: "Link Detail", 
        cell: (row) => (
            <div>
                <div className="text-emerald-400 font-mono text-sm">/{row.slug}</div>
                <div className="text-xs text-slate-500 max-w-[150px] truncate" title={row.targetUrl}>{row.targetUrl}</div>
            </div>
        ) 
    },
    { 
        header: "Risk Level", 
        accessor: "reports", 
        cell: (row) => (
            <div className="flex items-center gap-2">
                <span className={row.reports > 10 ? "text-red-400 font-bold" : "text-slate-500"}>{row.reports} Reports</span>
                {row.reports > 10 && <Flag className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />}
            </div>
        ) 
    },
    { header: "Status", cell: (row) => <Badge variant={row.status === 'active' ? 'success' : 'danger'}>{row.status}</Badge> },
    { 
        header: "Moderation", 
        cell: (row) => (
            <div className="flex gap-2">
                <button className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Inspect Content"><Eye className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 bg-slate-800 rounded hover:bg-yellow-900/30 text-slate-400 hover:text-yellow-500 transition-colors" title="Flag as Suspicious"><Flag className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 bg-slate-800 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors" title="Delete Link"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
        ) 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white">Link Moderation</h1>
            <p className="text-slate-400 text-sm">Review flagged content and manage system-wide links.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <input placeholder="Search slug, url, or user..." className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 w-full sm:w-64" />
            <Button variant="danger" className="w-auto whitespace-nowrap">Bulk Purge</Button>
        </div>
      </div>
      <Table columns={columns} data={allLinks} />
    </div>
  );
};

export default LinkManagement;