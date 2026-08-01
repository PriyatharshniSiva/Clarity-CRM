import React from 'react';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { MemberAvatarGroup } from './MemberAvatarGroup';
import { ProgressRing } from './ProgressRing';
import { Calendar, MessageSquare, CheckSquare, ChevronRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProjectCard = ({ project, onSelect, onOpenChat }) => {
  const navigate = useNavigate();

  const openTasksCount = project.tasks?.filter(t => t.status !== 'COMPLETED' && t.status !== 'APPROVED').length || 0;
  const totalTasksCount = project.tasks?.length || 0;

  return (
    <div
      onClick={() => onSelect && onSelect(project)}
      className="bg-card border border-border/60 p-5 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer group hover:border-primary/40 text-left"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              {project.projectCode}
            </span>
            <PriorityBadge priority={project.priority} />
          </div>
          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {project.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {project.description || 'No description specified.'}
          </p>
        </div>

        <ProgressRing progress={project.progressPercent || 0} size={54} strokeWidth={5} />
      </div>

      {/* Status & Health Badges */}
      <div className="flex items-center justify-between border-y border-border/20 py-2.5">
        <ProjectStatusBadge status={project.status} isOverdue={project.isOverdue} health={project.health} />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <span>{totalTasksCount - openTasksCount}/{totalTasksCount} Tasks</span>
        </div>
      </div>

      {/* Footer Info: Leader, Members & Dates */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Project Lead</span>
            <span className="text-xs font-bold text-foreground flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-primary" />
              {project.leader?.name || 'Unassigned'}
            </span>
          </div>

          <div className="h-6 w-px bg-border/40" />

          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Team</span>
            <MemberAvatarGroup members={project.members || []} limit={3} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.chatRoom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenChat) onOpenChat(project.chatRoom);
                else navigate('/chat');
              }}
              className="p-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition-all"
              title="Open 1:1 Project Chat"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}

          <div className="p-2 rounded-xl bg-muted/40 group-hover:bg-primary group-hover:text-primary-foreground text-muted-foreground transition-all">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
