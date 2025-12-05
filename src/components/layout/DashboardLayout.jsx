import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, Link as LinkIcon, BarChart2, LogOut, Settings, Menu, X, Shield } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Navbar } from './Navbar';

const SidebarItem = ({ icon: Icon, label, to, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
      active 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </Link>
);

const DashboardLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        // Base Layout (Mobile & Desktop shared)
        "fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transition-transform duration-200 ease-in-out flex flex-col",
        
        // Desktop State (Always visible, reset transform)
        "md:translate-x-0",

        // Mobile State (Toggle based on state)
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xl tracking-tight">
            <Shield className="w-6 h-6" />
            <span>Deadman Link</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            <div>
                <p className="px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Operations</p>
                <SidebarItem icon={LayoutDashboard} label="Overview" to="/dashboard" active={location.pathname === '/dashboard'} onClick={() => setIsMobileMenuOpen(false)} />
                <SidebarItem icon={LinkIcon} label="My Links" to="/dashboard/links" active={location.pathname.startsWith('/dashboard/links')} onClick={() => setIsMobileMenuOpen(false)} />
                <SidebarItem icon={BarChart2} label="Analytics" to="/dashboard/analytics" active={location.pathname.startsWith('/dashboard/analytics')} onClick={() => setIsMobileMenuOpen(false)} />
            </div>
            <div>
                <p className="px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">System</p>
                <SidebarItem icon={Settings} label="Settings" to="/dashboard/settings" active={location.pathname === '/dashboard/settings'} onClick={() => setIsMobileMenuOpen(false)} />
            </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {/* Mobile Header Toggle */}
        <div className="md:hidden h-16 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-950 sticky top-0 z-20">
             <div className="flex items-center gap-2 text-emerald-500 font-bold">
                <Shield className="w-5 h-5" />
                <span>Deadman</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-400">
                {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
        </div>

        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;