import React from 'react';
import { History, Sparkles, CheckCircle2, User, FileText, Calendar } from 'lucide-react';

const getUploadUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
};

export const ActivityItem = ({ item }) => {
  const getActionIcon = () => {
    switch (item.action) {
      case 'STATUS_CHANGE':
        return <Sparkles className="h-3.5 w-3.5 text-primary" />;
      case 'COMPLETED':
        return <CheckCircle2 className="h-3.5 w-3.5 text-primary" />;
      case 'EXTENDED':
        return <Calendar className="h-3.5 w-3.5 text-amber-500" />;
      case 'DOCUMENT_UPLOAD':
        return <FileText className="h-3.5 w-3.5 text-sky-500" />;
      default:
        return <History className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const user = item.changedBy || item.user;
  const name = user?.name || 'System User';
  const pic = user?.profilePic ? getUploadUrl(user.profilePic) : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/30 hover:border-primary/30 transition-all text-left">
      <img
        src={pic}
        alt={name}
        className="h-7 w-7 rounded-full object-cover border shrink-0 mt-0.5"
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {getActionIcon()}
            <span className="text-xs font-bold text-foreground">{name}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {item.detail}
        </p>
      </div>
    </div>
  );
};
