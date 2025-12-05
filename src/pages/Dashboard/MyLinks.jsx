import React, { useState } from 'react';
import { Plus, ExternalLink, Copy, QrCode, Lock, Flame, Eye, FolderOpen, Star, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CreateLinkForm } from '../../components/links/CreateLinkForm';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { useFetch } from '../../hooks/useFetch';
import { useClipboard } from '../../hooks/useClipboard';
import { QRPopup } from '../../components/links/QRPopup';

const MyLinks = () => {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [qrLink, setQrLink] = useState(null);
  const [filter, setFilter] = useState('All'); // Supports "Collections" feature
  
  // Fetch links (this would eventually filter by user ID)
  const { data: links, loading, refetch } = useFetch('/links');
  const { copy } = useClipboard();

  const handleLinkCreated = () => {
    setCreateOpen(false);
    refetch();
  };

  const columns = [
    {
      header: "Identity",
      className: "w-1/3",
      cell: (row) => (
        <div className="flex items-center gap-3">
             {/* Feature: Favorites / Highlights */}
             <button className="text-slate-600 hover:text-yellow-400 transition-colors" title="Mark as Favorite">
                <Star className="w-4 h-4" /> 
             </button>
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-700">
                {row.status === 'expired' ? <Flame className="w-5 h-5 text-red-500" /> : <ExternalLink className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
                <div className="font-medium text-slate-200 truncate">{row.title || 'Untitled Operation'}</div>
                <div className="text-xs text-slate-500 truncate max-w-[200px]">{row.targetUrl}</div>
            </div>
        </div>
      )
    },
    {
      header: "Security",
      cell: (row) => (
        <div className="flex gap-2">
            {/* Feature: Visual indicators for advanced security features */}
            {row.slug.includes('secure') && <Lock className="w-4 h-4 text-emerald-500" title="Password Protected" />}
            {row.slug.includes('burn') && <Flame className="w-4 h-4 text-orange-500" title="Self-Destruct" />}
            {row.slug.includes('preview') && <Eye className="w-4 h-4 text-blue-500" title="Safe Preview" />}
        </div>
      )
    },
    {
      header: "Short Link",
      cell: (row) => (
        <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-lg border border-slate-800 w-fit">
            <span className="font-mono text-[11px] text-emerald-400 pl-1">/{row.slug}</span>
            <div className="h-4 w-px bg-slate-800 mx-1"></div>
            {/* Feature: Quick Copy */}
            <button onClick={(e) => { e.stopPropagation(); copy(`${window.location.origin}/${row.slug}`); }} className="hover:text-white text-slate-500" title="Copy Link"><Copy className="w-3.5 h-3.5" /></button>
            {/* Feature: QR Code Generation */}
            <button onClick={(e) => { e.stopPropagation(); setQrLink(`${window.location.origin}/${row.slug}`); }} className="hover:text-white text-slate-500" title="Get QR Code"><QrCode className="w-3.5 h-3.5" /></button>
        </div>
      )
    },
    {
        header: "Status",
        cell: (row) => <Badge variant={row.status === 'active' ? 'success' : 'danger'}>{row.status}</Badge>
    },
    { header: "Clicks", accessor: "clicks", className: "text-center font-mono text-slate-400" },
    { header: "Created", cell: (row) => <span className="text-slate-500 text-xs">{new Date(row.createdAt).toLocaleDateString()}</span> }
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-emerald-500" />
            Mission Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage, track, and destroy your secure endpoints.</p>
        </div>
        <div className="flex gap-2">
            {/* Feature: Collections / Folders Filtering */}
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select 
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 appearance-none h-10"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="All">All Collections</option>
                    <option value="Intel">Intel</option>
                    <option value="Personal">Personal</option>
                </select>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="w-full md:w-auto px-6">
                <Plus className="w-4 h-4 mr-2" />
                Create Link
            </Button>
        </div>
      </div>

      <Table columns={columns} data={links} isLoading={loading} />
      
      {/* Feature: Advanced Creation Form */}
      <Modal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} title="Create Secure Link">
        <CreateLinkForm onSuccess={handleLinkCreated} />
      </Modal>
      
      {/* Feature: QR Popup */}
      <QRPopup isOpen={!!qrLink} onClose={() => setQrLink(null)} url={qrLink || ''} />
    </div>
  );
};

export default MyLinks;