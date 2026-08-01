import React from 'react';
import { Lock, Unlock } from 'lucide-react';

export const DependencyBadge = ({ isUnlocked = true, prerequisitesCount = 0 }) => {
  if (prerequisitesCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-border/30">
        <Unlock className="h-3 w-3 text-primary" /> Root Task
      </span>
    );
  }

  if (isUnlocked) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
        <Unlock className="h-3 w-3" /> Unlocked ({prerequisitesCount} Done)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
      <Lock className="h-3 w-3" /> Locked ({prerequisitesCount} Open)
    </span>
  );
};
