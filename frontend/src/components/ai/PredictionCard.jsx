import React from 'react';
import { Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AIConfidenceBadge } from './AIConfidenceBadge';

export const PredictionCard = ({ prediction }) => {
  if (!prediction) return null;
  const getProbabilityBadge = () => {
    switch (prediction.delayProbability) {
      case 'VERY_HIGH':
        return <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20">VERY HIGH DELAY RISK</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2.5 py-0.5 rounded-lg border border-orange-500/20">HIGH DELAY RISK</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">MEDIUM DELAY RISK</span>;
      default:
        return <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">ON TRACK (LOW RISK)</span>;
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl border border-white/70 dark:border-white/10 shadow-xs space-y-3 text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground">
          [{prediction.projectCode}] {prediction.name}
        </h4>
        <AIConfidenceBadge score={prediction.confidenceScore || 85} />
      </div>

      <div className="flex items-center justify-between">
        {getProbabilityBadge()}
        <span className="text-xs font-mono font-bold text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-primary" /> Est. Finish: {new Date(prediction.estimatedFinishDate).toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/20">
        <span className="font-bold text-foreground block text-[10px] uppercase">Reasoning:</span>
        <p className="line-clamp-2">{prediction.reasoning?.join(' ')}</p>
      </div>
    </div>
  );
};
