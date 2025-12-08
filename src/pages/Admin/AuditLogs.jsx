import React from 'react';
import { Table } from '../../components/ui/Table';

const AuditLogs = () => {
  const logs = [
    { id: 1, action: 'DELETE_LINK', target: 'slug: free-money', admin: 'Admin One', ip: '192.168.1.1', time: '2023-10-25 10:30:00' },
    { id: 2, action: 'BAN_USER', target: 'user: bot@spam.net', admin: 'Admin One', ip: '192.168.1.1', time: '2023-10-25 10:35:00' },
    { id: 3, action: 'UPDATE_CONFIG', target: 'Rate Limits', admin: 'System', ip: 'localhost', time: '2023-10-25 09:00:00' },
  ];

  const columns = [
    { header: "Timestamp", accessor: "time", className: "font-mono text-xs text-slate-500" },
    { header: "Action", accessor: "action", className: "font-bold text-white" },
    { header: "Target", accessor: "target" },
    { header: "Admin", accessor: "admin" },
    { header: "IP Address", accessor: "ip", className: "font-mono" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">System Audit Logs</h1>
      <Table columns={columns} data={logs} />
    </div>
  );
};
export default AuditLogs;