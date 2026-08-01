import React from 'react';
import { PriorityBadge } from './PriorityBadge';
import { Clock, CheckSquare, Paperclip, MessageSquare, GripVertical } from 'lucide-react';

const getUploadUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
};

export const TaskCard = ({ task, onClick, onDragStart }) => {
  const isOverdue = new Date(task.deadline) < new Date() && !['APPROVED', 'COMPLETED'].includes(task.status);
  const doneSubtasks = task.subtasks?.filter(s => s.isDone).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onClick={() => onClick && onClick(task)}
      className="group bg-card hover:bg-card/95 border border-border/40 hover:border-primary/40 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer space-y-2.5 text-left"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors cursor-grab" />
          <PriorityBadge priority={task.priority} />
        </div>
        {task.type && (
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border">
            {task.type}
          </span>
        )}
      </div>

      {/* Title & Description */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Linked Project Code Tag */}
      {task.project && (
        <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
          <span>{task.project.projectCode}</span>
          <span className="truncate max-w-[120px] font-sans font-medium text-foreground/80">({task.project.name})</span>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-2 border-t border-border/20 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {/* Deadline */}
          <span className={`inline-flex items-center gap-1 font-semibold ${isOverdue ? 'text-rose-500 font-bold' : ''}`}>
            <Clock className="h-3 w-3" />
            <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </span>

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              <span>{doneSubtasks}/{totalSubtasks}</span>
            </span>
          )}

          {/* Attachments */}
          {task.attachments?.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments.length}</span>
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee && (
          <img
            src={task.assignee.profilePic ? getUploadUrl(task.assignee.profilePic) : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assignee.name)}`}
            alt={task.assignee.name}
            title={`Assigned to ${task.assignee.name}`}
            className="h-5 w-5 rounded-full border object-cover"
          />
        )}
      </div>
    </div>
  );
};
