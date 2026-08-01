import React from 'react';
import { Award, CheckCircle2, Clock, FileText } from 'lucide-react';

export const ProductivityCard = ({ productivity }) => {
  return (
    <div className="glass-card p-5 rounded-2xl border border-white/70 dark:border-white/10 shadow-xs space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Productivity Metrics</h3>
        </div>
        <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
          {productivity.completionRatePercent}% Completion Rate
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-xl bg-muted/20 border border-border/20 space-y-0.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Tasks Assigned</span>
          <div className="text-lg font-black text-foreground">{productivity.totalAssigned}</div>
        </div>

        <div className="p-3 rounded-xl bg-muted/20 border border-border/20 space-y-0.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase text-primary">Completed</span>
          <div className="text-lg font-black text-primary">{productivity.completedCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-muted/20 border border-border/20 space-y-0.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase text-amber-500">On-Time</span>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">{productivity.onTimeTasks}</div>
        </div>

        <div className="p-3 rounded-xl bg-muted/20 border border-border/20 space-y-0.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase text-rose-500">Overdue / Late</span>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400">{productivity.lateTasks}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/20">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" /> Total Hours Logged: <strong className="text-foreground font-mono">{productivity.totalLoggedHours} hrs</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-sky-500" /> Work Logs: <strong className="text-foreground font-mono">{productivity.workLogsSubmitted}</strong>
        </span>
      </div>
    </div>
  );
};
