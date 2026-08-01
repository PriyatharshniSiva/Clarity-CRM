import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Sparkles, CheckCircle2, AlertCircle, Database, Zap } from 'lucide-react';
import { AIConfidenceBadge } from './AIConfidenceBadge';

export const AIRecommendationCard = ({ recommendation, onFeedback }) => {
  if (!recommendation) return null;
  const [rated, setRated] = useState(null);

  const handleRating = (rating) => {
    setRated(rating);
    if (onFeedback) {
      onFeedback(recommendation.recommendationId, rating, recommendation.category);
    }
  };

  const getCategoryColor = () => {
    switch (recommendation.category) {
      case 'RISK':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'RESOURCE':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'SCHEDULE':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'DEPENDENCY':
        return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
      default:
        return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-white/70 dark:border-white/10 shadow-xs space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${getCategoryColor()}`}>
            {recommendation.category}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono font-bold">
            {recommendation.recommendationId}
          </span>
        </div>
        <AIConfidenceBadge score={recommendation.confidenceScore || 88} />
      </div>

      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-foreground line-clamp-2">
          {recommendation.problem}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground/80">Reason:</strong> {recommendation.reason}
        </p>
      </div>

      {/* Actionable AI Recommendation Box */}
      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
        <div className="font-bold text-primary flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Recommended Action:
        </div>
        <p className="text-foreground font-semibold leading-relaxed">
          {recommendation.recommendation}
        </p>
        <p className="text-[11px] text-primary font-medium pt-1">
          ✓ Expected Impact: {recommendation.expectedImpact}
        </p>
      </div>

      {/* Data Sources & Feedback Controls */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/20">
        <div className="flex items-center gap-1.5 truncate max-w-[240px]">
          <Database className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="truncate">Data Sources: {recommendation.dataSources?.join(', ') || 'CRM Analytics'}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] font-bold mr-1">Was this helpful?</span>
          <button
            onClick={() => handleRating('HELPFUL')}
            className={`p-1 rounded transition-all ${
              rated === 'HELPFUL' ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'
            }`}
            title="Helpful"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleRating('NOT_HELPFUL')}
            className={`p-1 rounded transition-all ${
              rated === 'NOT_HELPFUL' ? 'bg-rose-500 text-white' : 'hover:bg-muted text-muted-foreground'
            }`}
            title="Not Helpful"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
