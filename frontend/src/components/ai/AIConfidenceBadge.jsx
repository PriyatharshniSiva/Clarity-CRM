import React from 'react';
import { Sparkles } from 'lucide-react';

export const AIConfidenceBadge = ({ score = 85 }) => {
  const getBadgeColor = () => {
    if (score >= 90) return 'text-primary bg-primary/10 border-primary/20';
    if (score >= 75) return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
    if (score >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getBadgeColor()}`}>
      <Sparkles className="h-3 w-3" /> {score}% Confidence
    </span>
  );
};
