import React from 'react';
import { cn } from '../../utils/cn';

export const Input = ({ label, error, className, icon, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={cn(
            "w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 transition-all",
            "focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            icon && "pl-10", 
            className
          )}
          {...props}
        />
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {icon}
          </div>
        )}
      </div>
      {error && <p className="text-red-400 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
};