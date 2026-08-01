import React from 'react';
import { Clock, CheckCircle, PauseCircle, XCircle, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';

export const ProjectStatusBadge = ({ status, isOverdue, health }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: 'Active',
          bg: 'bg-primary/10 text-primary border-primary/30',
          icon: Sparkles
        };
      case 'ON_HOLD':
        return {
          label: 'On Hold',
          bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400',
          icon: PauseCircle
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bg: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400',
          icon: CheckCircle
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          bg: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400',
          icon: XCircle
        };
      case 'DRAFT':
        return {
          label: 'Draft',
          bg: 'bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-400',
          icon: Clock
        };
      case 'SCHEDULED':
        return {
          label: 'Scheduled',
          bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 dark:text-indigo-400',
          icon: Clock
        };
      case 'ARCHIVED':
        return {
          label: 'Archived',
          bg: 'bg-gray-500/10 text-gray-500 border-gray-500/30 dark:text-gray-400',
          icon: ShieldAlert
        };
      default:
        return {
          label: status || 'Unknown',
          bg: 'bg-muted text-muted-foreground border-border',
          icon: Clock
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const getHealthBadge = () => {
    if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'ARCHIVED') return null;
    if (isOverdue || health === 'Delayed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 border border-rose-500/30 dark:text-rose-400 animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          <span>Overdue</span>
        </span>
      );
    }
    if (health === 'At Risk') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:text-amber-400">
          <span>🟡 At Risk</span>
        </span>
      );
    }
    if (health === 'On Track' || status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
          <span>🟢 On Track</span>
        </span>
      );
    }
    return null;
  };

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs ${config.bg}`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </span>
      {getHealthBadge()}
    </div>
  );
};
