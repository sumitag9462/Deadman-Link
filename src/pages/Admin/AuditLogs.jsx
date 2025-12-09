import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui/Table';
import { FileText, RefreshCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs', {
        params: { page: pageNum, limit: 50 }
      });
      
      const formattedLogs = res.data.logs.map(log => {
        const date = new Date(log.timestamp);
        return {
          id: log._id,
          time: date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          action: formatAction(log.action),
          target: log.target,
          admin: log.adminName || log.adminEmail,
          ip: log.ip,
        };
      });
      
      setLogs(formattedLogs);
      setPage(res.data.page);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action) => {
    // Convert ACTION_NAME to Action Name
    return action
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    { 
      header: "Time", 
      accessor: "time", 
      className: "text-sm text-slate-300 whitespace-nowrap" 
    },
    { 
      header: "Action", 
      accessor: "action", 
      className: "font-semibold text-emerald-400" 
    },
    { 
      header: "Target", 
      accessor: "target",
      className: "text-slate-200" 
    },
    { 
      header: "Admin", 
      accessor: "admin", 
      className: "text-blue-400" 
    },
    { 
      header: "IP", 
      accessor: "ip", 
      className: "font-mono text-xs text-slate-500" 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-lg text-slate-300">Track all administrative actions and system changes</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchLogs(page)}
          disabled={loading}
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <div className="absolute -top-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {loading && <p className="text-slate-400">Loading audit logs...</p>}
      
      {!loading && logs.length === 0 && (
        <p className="text-slate-400">No audit logs found.</p>
      )}
      
      {!loading && logs.length > 0 && (
        <>
          <Table columns={columns} data={logs} />
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchLogs(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-slate-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchLogs(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default AuditLogs;