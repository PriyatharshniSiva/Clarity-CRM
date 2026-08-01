import React from 'react';
import { ArrowDown, ArrowUp, AlertOctagon, Zap } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  const getConfig = () => {
    switch (priority) {
      case 'CRITICAL':
      case 'URGENT':
        return {
          label: priority,
          bg: 'bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400',
          icon: AlertOctagon
        };
      case 'HIGH':
        return {
          label: 'High',
          bg: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
          icon: ArrowUp
        };
      case 'MEDIUM':
        return {
          label: 'Medium',
          bg: 'bg-sky-500/15 text-sky-600 border-sky-500/30 dark:text-sky-400',
          icon: Zap
        };
      case 'LOW':
        return {
          label: 'Low',
          bg: 'bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400',
          icon: ArrowDown
        };
      default:
        return {
          label: priority || 'Medium',
          bg: 'bg-muted text-muted-foreground border-border',
          icon: Zap
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border tracking-wider ${config.bg}`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </span>
  );
};
