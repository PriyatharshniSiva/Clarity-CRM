import React from 'react';
import { Sparkles, Calendar, TrendingUp } from 'lucide-react';

export const AIExecutiveSummary = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/70 dark:border-white/10 shadow-xs space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-base font-bold text-foreground">AI Executive Summary</h3>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> {summary.period || 'WEEKLY'} SUMMARY
        </span>
      </div>

      <p className="text-xs text-foreground/90 leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/30 whitespace-pre-wrap font-medium">
        {summary.summaryText}
      </p>

      <div className="text-[10px] text-muted-foreground font-mono text-right">
        Generated At: {new Date(summary.generatedAt).toLocaleString()}
      </div>
    </div>
  );
};
