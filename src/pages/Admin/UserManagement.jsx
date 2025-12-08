import React from 'react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { MoreVertical } from 'lucide-react';

const UserManagement = () => {
  const users = [
    { _id: '1', name: 'Agent 007', email: 'bond@mi6.gov', role: 'Premium', status: 'Active', lastLogin: '2 mins ago' },
    { _id: '2', name: 'Spam Bot', email: 'bot@spam.net', role: 'Free', status: 'Banned', lastLogin: '2 days ago' },
    { _id: '3', name: 'Admin One', email: 'root@sys.gov', role: 'Admin', status: 'Active', lastLogin: 'Now' },
  ];

  const columns = [
    { header: "User", cell: (row) => <div><div className="text-white font-medium">{row.name}</div><div className="text-xs text-slate-500">{row.email}</div></div> },
    { header: "Role", cell: (row) => <Badge className="bg-slate-800">{row.role}</Badge> },
    { header: "Status", cell: (row) => <span className={row.status === 'Active' ? 'text-emerald-400' : 'text-red-400'}>{row.status}</span> },
    { header: "Last Login", accessor: "lastLogin" },
    { header: "Actions", cell: () => <MoreVertical className="w-4 h-4 text-slate-500 cursor-pointer" /> }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">User Access Controls</h1>
      <Table columns={columns} data={users} />
    </div>
  );
};
export default UserManagement;