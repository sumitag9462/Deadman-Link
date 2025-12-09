import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between shadow-lg shadow-black/10">

      {/* Right Side Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-2 text-slate-400 hover:text-emerald-400 transition-colors hover:bg-slate-700/30 rounded-lg duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50 animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-slate-700/50 mx-2 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white leading-none">{user?.name || 'Agent'}</p>
            <p className="text-xs text-slate-500 mt-1">User</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all hover:scale-105">
            {user?.name?.[0] || <User className="w-5 h-5" />}
          </div>
        </div>
      </div>
    </header>
  );
};