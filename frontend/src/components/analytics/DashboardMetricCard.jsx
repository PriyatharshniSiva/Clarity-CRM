import React from 'react';

export const DashboardMetricCard = ({ title, value, subtext, icon: Icon, color = 'primary' }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'emerald':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'amber':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'rose':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'sky':
        return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
      case 'purple':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default:
        return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-xs space-y-2 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${getColorClasses()}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="text-2xl font-black text-foreground font-mono">{value}</div>

      {subtext && (
        <p className="text-[10px] text-muted-foreground font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
};
