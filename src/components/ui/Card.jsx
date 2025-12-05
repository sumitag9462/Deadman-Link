import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn("bg-slate-900 border border-slate-800 rounded-xl shadow-sm", className)} 
      {...props}
    >
      {children}
    </div>
  );
};