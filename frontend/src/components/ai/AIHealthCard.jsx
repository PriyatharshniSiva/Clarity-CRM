import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, Activity, ArrowRight } from 'lucide-react';
import { AIConfidenceBadge } from './AIConfidenceBadge';

export const AIHealthCard = ({ health }) => {
  if (!health) return null;

  const getBadgeStyle = () => {
    switch (health.healthBadge) {
      case 'HEALTHY':
        return { text: '🟢 Healthy', cls: 'text-primary bg-primary/10 border-primary/20' };
      case 'AT_RISK':
        return { text: '🟡 At Risk', cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
      case 'CRITICAL':
        return { text: '🟠 Critical', cls: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
      default:
        return { text: '🔴 Delayed', cls: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    }
  };

  const badge = getBadgeStyle();

  return (
    <div className="glass-card p-5 rounded-2xl border border-white/70 dark:border-white/10 shadow-xs space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Health Score</span>
          <h3 className="text-base font-black text-foreground">
            [{health.projectCode}] {health.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${badge.cls}`}>
            {badge.text}
          </span>
          <div className="text-2xl font-black text-primary font-mono">{health.healthScore}/100</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden border border-border/30">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            health.healthScore > 80 ? 'bg-primary' : health.healthScore > 60 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${health.healthScore}%` }}
        />
      </div>

      {/* Health Drivers & Reasons */}
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Diagnostic Drivers & Reasons</h4>
        <ul className="space-y-1 text-xs text-foreground/90">
          {health.reasons && health.reasons.map((r, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended Actions */}
      {health.recommendedActions && health.recommendedActions.length > 0 && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
          <span className="font-bold text-primary flex items-center gap-1">
            <ArrowRight className="h-3.5 w-3.5" /> AI Recommended Action:
          </span>
          <p className="text-foreground/90 font-medium">{health.recommendedActions[0]}</p>
        </div>
      )}
    </div>
  );
};
