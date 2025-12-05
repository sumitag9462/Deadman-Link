import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Search, User } from 'lucide-react';
import { Input } from '../ui/Input';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Search Bar */}
      <div className="hidden md:block w-96">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search logs, links, or dossiers..."
            className="w-full bg-slate-900 border border-slate-800 rounded-full py-1.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border border-slate-950"></span>
        </button>

        <div className="h-6 w-px bg-slate-800 mx-2 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white leading-none">{user?.name || 'Agent'}</p>
            <p className="text-xs text-slate-500 mt-1">Level 4 Clearance</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            {user?.name?.[0] || <User className="w-4 h-4" />}
          </div>
        </div>
      </div>
    </header>
  );
};