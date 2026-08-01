import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export const TimeTracker = ({ estimatedHours = 0, actualHours = 0 }) => {
  const est = parseFloat(estimatedHours) || 0;
  const act = parseFloat(actualHours) || 0;
  const variance = act - est;

  const getVarianceBadge = () => {
    if (est === 0 && act === 0) {
      return <span className="text-[10px] text-muted-foreground font-bold">No estimation set</span>;
    }
    if (act <= est) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
          <CheckCircle2 className="h-3 w-3" /> On Estimate ({variance <= 0 ? `${variance.toFixed(1)}h` : `+${variance.toFixed(1)}h`})
        </span>
      );
    }
    if (act <= est * 1.1) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <Clock className="h-3 w-3" /> Near Estimate (+{variance.toFixed(1)}h)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 animate-pulse">
        <AlertTriangle className="h-3 w-3" /> Exceeded Estimate (+{variance.toFixed(1)}h)
      </span>
    );
  };

  const progressPercent = est > 0 ? Math.min(100, Math.round((act / est) * 100)) : (act > 0 ? 100 : 0);

  return (
    <div className="p-4 rounded-xl bg-card border border-border/30 shadow-xs space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground">Time Tracking & Estimation</h4>
        </div>
        {getVarianceBadge()}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-muted/20 border border-border/20">
          <span className="text-[10px] font-bold text-muted-foreground uppercase block">Estimated</span>
          <span className="text-sm font-black text-foreground font-mono">{est} Hours</span>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/20 border border-border/20">
          <span className="text-[10px] font-bold text-muted-foreground uppercase block">Actual Logged</span>
          <span className="text-sm font-black text-primary font-mono">{act} Hours</span>
        </div>
      </div>

      {/* Progress Bar */}
      {est > 0 && (
        <div className="space-y-1">
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border/30">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                act > est ? 'bg-rose-500' : act > est * 0.9 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
