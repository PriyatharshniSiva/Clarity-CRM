import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Trash2, Edit3 } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

export const WorkLogCard = ({ log, onEdit, onDelete }) => {
  if (!log) return null;
  const user = log.user || {};
  const name = user.name || 'User';

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
          <UserAvatar user={user} className="h-8 w-8 rounded-full border shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-foreground">{name}</h4>
            <span className="text-[10px] text-muted-foreground font-mono">
              {new Date(log.workDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(log)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  title="Edit Log"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(log.id)}
                  className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                  title="Delete Log"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">
            {log.hoursLogged} hrs
          </span>
          <span className="text-xs font-semibold text-foreground">
            {log.task ? log.task.title : 'General Work'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {log.description}
        </p>
      </div>

      {log.adminRemarks && (
        <div className="p-2 rounded-lg bg-muted/40 border text-[10px] text-muted-foreground">
          <strong className="text-foreground">Review Notes:</strong> {log.adminRemarks}
        </div>
      )}
    </div>
  );
};

export default WorkLogCard;
