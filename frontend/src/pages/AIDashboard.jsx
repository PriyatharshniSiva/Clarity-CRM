import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Sparkles,
  RefreshCw,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import {
  AIHealthCard,
  AIRecommendationCard,
  AIExecutiveSummary,
  PredictionCard
} from '../components/ai';

const AIDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const fetchAIDashboard = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const endpoint = forceRefresh ? '/ai/analyze' : '/ai/dashboard';
      const method = forceRefresh ? 'post' : 'get';

      const res = await api[method](endpoint);
      const data = forceRefresh ? res.data.data : res.data;

      setAiData(data);
      if (forceRefresh) setAlertMsg('AI Analysis successfully recalculated and refreshed!');
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Failed to fetch AI dashboard:', err);
      setAlertMsg('Failed to load AI Insights.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAIDashboard();
  }, []);

  const handleFeedback = async (recommendationId, rating, category) => {
    try {
      await api.post('/ai/feedback', { recommendationId, rating, category });
      setAlertMsg(`Feedback recorded (${rating === 'HELPFUL' ? '👍 Helpful' : '👎 Not Helpful'}). Thank you!`);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm font-bold animate-pulse">
        Initializing Innoveity AI Engine & Running Analytics...
      </div>
    );
  }

  const meta = aiData?.metadata || {};

  return (
    <div className="flex-1 flex flex-col space-y-6 text-left">
      {/* Alert Banner */}
      {alertMsg && (
        <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-2xl flex items-center justify-between animate-in fade-in duration-300">
          <span className="text-xs font-bold">{alertMsg}</span>
          <button onClick={() => setAlertMsg('')} className="text-primary hover:opacity-70">
            ×
          </button>
        </div>
      )}

      {/* Header & Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-primary animate-pulse" /> Enterprise AI Insights & Advisory
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Intelligent project health evaluation, delay predictions, workload optimization, and actionable recommendations.
          </p>
        </div>

        <button
          onClick={() => fetchAIDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary-hover transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Recalculating AI...' : 'Refresh AI Analysis'}
        </button>
      </div>

      {/* AI Versioning & Metadata Banner */}
      <div className="p-3.5 rounded-2xl bg-card border border-border/30 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          <span className="font-bold text-foreground">Engine: {meta.version?.engine} v{meta.version?.engineVersion}</span>
          <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded border">Rules v{meta.version?.rulesVersion}</span>
          <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded border">LLM: {meta.version?.llmVersion}</span>
        </div>
        <div className="font-mono text-[10px]">
          Confidence: <strong className="text-primary">{meta.confidenceScore}%</strong> | Generated: {meta.generatedAt ? new Date(meta.generatedAt).toLocaleTimeString() : 'Now'}
        </div>
      </div>

      {/* AI Executive Summary */}
      {aiData?.summary && <AIExecutiveSummary summary={aiData.summary} />}

      {/* Main Grid: Project Health & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Health Scores */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> AI Project Health Evaluation
          </h2>
          <div className="space-y-3">
            {aiData?.projectHealths && aiData.projectHealths.map(h => (
              <AIHealthCard key={h.projectId} health={h} />
            ))}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Actionable Recommendations
          </h2>
          <div className="space-y-3">
            {aiData?.recommendations && aiData.recommendations.map(r => (
              <AIRecommendationCard key={r.recommendationId} recommendation={r} onFeedback={handleFeedback} />
            ))}
          </div>
        </div>
      </div>

      {/* Delay Predictions Section */}
      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-500" /> Predictive Delay Risk Analysis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiData?.delayPredictions && aiData.delayPredictions.map(p => (
            <PredictionCard key={p.projectId} prediction={p} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
