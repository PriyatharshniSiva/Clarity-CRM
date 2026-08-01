import React from 'react';
import { User, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const getUploadUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
};

export const ResourceCard = ({ resource }) => {
  if (!resource) return null;
  const name = resource.name || 'User';
  const pic = resource.profilePic ? getUploadUrl(resource.profilePic) : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

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
          <img src={pic} alt={name} className="h-9 w-9 rounded-full object-cover border shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-foreground">{name}</h4>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{resource.role}</span>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-muted/20 border border-border/20">
          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Capacity</span>
          <span className="font-bold text-foreground font-mono">{resource.capacityHours}h</span>
        </div>
        <div className="p-2 rounded-lg bg-muted/20 border border-border/20">
          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Assigned</span>
          <span className="font-bold text-primary font-mono">{resource.assignedHours}h</span>
        </div>
        <div className="p-2 rounded-lg bg-muted/20 border border-border/20">
          <span className="text-[9px] font-bold text-muted-foreground uppercase block">Logged</span>
          <span className="font-bold text-emerald-500 font-mono">{resource.loggedHours}h</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border/30">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              resource.status === 'OVERALLOCATED' ? 'bg-rose-500' : resource.status === 'UNDERUTILIZED' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, resource.workloadPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
