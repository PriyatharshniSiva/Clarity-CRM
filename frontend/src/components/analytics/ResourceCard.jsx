import React from 'react';
import { User, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

export const ResourceCard = ({ resource }) => {
  if (!resource) return null;
  const name = resource.name || 'User';

  const getStatusBadge = () => {
    switch (resource.status) {
      case 'OVERALLOCATED':
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20"><AlertTriangle className="h-3 w-3" /> Overallocated ({resource.workloadPercent}%)</span>;
      case 'UNDERUTILIZED':
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"><Clock className="h-3 w-3" /> Underutilized ({resource.workloadPercent}%)</span>;
      case 'IDLE':
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">Idle (0%)</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><CheckCircle2 className="h-3 w-3" /> Balanced ({resource.workloadPercent}%)</span>;
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl border border-white/70 dark:border-white/10 shadow-xs space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar user={resource} className="h-9 w-9 rounded-full border shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-foreground">{name}</h4>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{resource.role}</span>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
          <span>Assigned Hours</span>
          <span className="font-bold text-foreground">{resource.assignedHours || 0} / 40 hrs</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border">
          <div
            className={`h-full transition-all ${
              resource.status === 'OVERALLOCATED' ? 'bg-rose-500' : resource.status === 'UNDERUTILIZED' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, resource.workloadPercent || 0)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
