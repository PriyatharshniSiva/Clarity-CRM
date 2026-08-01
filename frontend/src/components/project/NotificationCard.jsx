import React from 'react';
import { Bell, CheckCircle2, Lock, Sparkles, AlertTriangle, FileText, MessageSquare, Trash2 } from 'lucide-react';

export const NotificationCard = ({ notification, onMarkRead, onDelete }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'DEPENDENCY_UNLOCKED':
        return <Lock className="h-4 w-4 text-primary" />;
      case 'TASK_ASSIGNED':
      case 'TASK_APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'MILESTONE_COMPLETED':
      case 'PROJECT_COMPLETED':
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case 'DOCUMENT_UPLOADED':
        return <FileText className="h-4 w-4 text-sky-500" />;
      case 'CHAT_MENTION':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div
      onClick={() => !notification.isRead && onMarkRead && onMarkRead(notification.id)}
      className={`p-3.5 rounded-xl border transition-all space-y-1.5 text-left cursor-pointer ${
        notification.isRead
          ? 'bg-card border-border/30 opacity-70 hover:opacity-100'
          : 'bg-primary/5 border-primary/30 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h4 className="text-xs font-bold text-foreground line-clamp-1">{notification.title}</h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!notification.isRead && <span className="h-2 w-2 rounded-full bg-primary" title="Unread" />}
          <span className="text-[9px] text-muted-foreground font-mono">
            {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="text-muted-foreground hover:text-rose-500 p-1 rounded"
              title="Delete Notification"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-6">
        {notification.message}
      </p>
    </div>
  );
};
