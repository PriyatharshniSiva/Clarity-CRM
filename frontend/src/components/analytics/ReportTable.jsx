import React from 'react';
import { Download } from 'lucide-react';

export const ReportTable = ({ title, data = [], columns = [], onExport }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-2xl text-muted-foreground text-xs italic">
        No report records available to display.
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-white/70 dark:border-white/10 shadow-xs space-y-4 p-4 text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">{title} ({data.length} Records)</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-xs transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV / Data
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              {columns.map((col, idx) => (
                <th key={idx} className="p-2.5">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {data.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-muted/10 transition-colors">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="p-2.5 text-foreground/90 font-medium">
                    {col.cell ? col.cell(row) : row[col.accessorKey]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
