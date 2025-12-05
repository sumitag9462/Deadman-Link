import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Button } from '../../components/ui/Button';

const DashboardHome = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h1>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {['Total Links', 'Active Links', 'Total Clicks'].map((item) => (
          <div key={item} className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{item}</p>
            <p className="text-3xl font-bold text-white mt-2">0</p>
          </div>
        ))}
      </div>
      
      {/* Empty State Action */}
      <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center shadow-lg">
        <h3 className="text-white text-xl font-semibold mb-2">No links created yet</h3>
        <p className="text-slate-400 text-sm mb-6">Create your first deadman link to start tracking.</p>
        <div className="max-w-xs mx-auto">
            {/* Make this button navigate to the Links page */}
            <Button onClick={() => navigate('/dashboard/links')}>
              Create New Link
            </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;