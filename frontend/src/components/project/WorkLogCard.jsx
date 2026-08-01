import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Trash2, Edit3 } from 'lucide-react';

const getUploadUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
};

export const WorkLogCard = ({ log, onEdit, onDelete }) => {
  if (!log) return null;
  const user = log.user || {};
  const name = user.name || 'User';
  const pic = user.profilePic ? getUploadUrl(user.profilePic) : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

  const getStatusBadge = () => {
    switch (log.status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20"><CheckCircle2 className="h-2.5 w-2.5" /> Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20"><AlertCircle className="h-2.5 w-2.5" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"><Clock className="h-2.5 w-2.5" /> Pending</span>;
    }
  };

  return (
    <div className="glass-card border border-white/70 dark:border-white/10 p-4 rounded-xl shadow-xs hover:shadow-md transition-all space-y-3 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={pic} alt={name} className="h-8 w-8 rounded-full object-cover border shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-foreground">{name}</h4>
            <span className="text-[10px] text-muted-foreground font-mono">
              {new Date(log.workDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="font-mono text-xs font-black text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
            {log.hoursWorked} hrs
          </span>
        </div>
      </div>

      <p className="text-xs text-foreground/90 bg-muted/20 p-3 rounded-lg border border-border/20 whitespace-pre-wrap">
        {log.description}
      </p>

      {/* Footer Info: Task & Project links */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/20">
        <div className="flex items-center gap-2 truncate">
          {log.project && (
            <span className="font-bold text-primary truncate max-w-[120px]">
              [{log.project.projectCode}] {log.project.name}
            </span>
          )}
          {log.task && (
            <span className="truncate max-w-[150px] text-foreground/80 font-medium">
              Task: {log.task.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(log)} className="p-1 text-muted-foreground hover:text-primary rounded">
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(log.id)} className="p-1 text-muted-foreground hover:text-rose-500 rounded">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
