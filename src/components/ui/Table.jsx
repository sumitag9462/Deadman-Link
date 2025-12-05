import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export const Table = ({ columns, data, isLoading, onRowClick }) => {
  if (isLoading) {
    return (
      <div className="w-full py-12 flex justify-center items-center text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
        No data found in the system.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-xs font-medium border-b border-slate-800">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={cn("px-6 py-4", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.map((row, rowIndex) => (
            <tr 
              key={row._id || rowIndex} 
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                "group transition-colors hover:bg-slate-800/50",
                onRowClick && "cursor-pointer"
              )}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 text-slate-300">
                  {col.cell ? col.cell(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};