import React from 'react';
import { Calendar, CheckCircle2, Clock, Layers } from 'lucide-react';

export const MilestoneCard = ({ milestone, onSelect }) => {
  const tasksCount = milestone.tasks?.length || 0;
  const completedTasksCount = milestone.tasks?.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length || 0;
  const progressPercent = tasksCount > 0 ? Math.round((completedTasksCount / tasksCount) * 100) : (milestone.status === 'COMPLETED' ? 100 : 0);

  const getStatusBadge = () => {
    switch (milestone.status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">Completed</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">In Progress</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-500/10 text-slate-500 border border-slate-500/20">Pending</span>;
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(milestone)}
      className="glass-card border border-white/70 dark:border-white/10 p-4 rounded-xl shadow-sm hover:shadow-md transition-all space-y-3 text-left cursor-pointer group hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {milestone.title}
            </h4>
          </div>
          {milestone.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {milestone.description}
            </p>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
          <span>Progress ({completedTasksCount}/{tasksCount} Tasks)</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border/30">
          <div
            className={`h-full rounded-full transition-all duration-500 bg-primary`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Due Date */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/20">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
        </span>
        {milestone.status === 'COMPLETED' && (
          <span className="flex items-center gap-1 text-primary font-bold">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        )}
      </div>
    </div>
  );
};
