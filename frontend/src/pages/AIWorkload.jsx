import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { ResourceCard } from '../components/analytics';

const AIWorkload = () => {
  const [loading, setLoading] = useState(true);
  const [workloadData, setWorkloadData] = useState(null);

  const fetchWorkload = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/workload');
      setWorkloadData(res.data || {});
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch AI workload analysis:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, []);

  return (
    <div className="flex-1 flex flex-col space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-7 h-7 text-purple-500" /> AI Workload Optimization & Capacity Reassignment
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            AI-driven resource balancing detecting overloaded team members and recommending task reassignments.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm font-bold animate-pulse">
          Analyzing Team Workload & Resource Profiles...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Smart Task Reassignment Suggestions */}
          <div className="glass-card p-5 rounded-2xl border border-white/70 dark:border-white/10 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Smart Task Reassignment Suggestions
            </h2>

            {workloadData?.reassignmentSuggestions && workloadData.reassignmentSuggestions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                Workload is currently balanced. No reassignments needed.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workloadData?.reassignmentSuggestions && workloadData.reassignmentSuggestions.map((sugg, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
                    <div className="font-bold text-primary flex items-center justify-between">
                      <span>Task: {sugg.taskTitle} ({sugg.estimatedHours || 0}h)</span>
                      <span className="text-[10px] font-mono bg-primary/10 px-2 py-0.5 rounded">
                        {sugg.fromUserName} → {sugg.toUserName}
                      </span>
                    </div>
                    <p className="text-foreground/90 font-medium">{sugg.recommendationText}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ Expected Impact: {sugg.expectedImpact}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Member Workload Profiles */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team Member Workload Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workloadData?.profiles && workloadData.profiles.map(p => (
                <ResourceCard key={p.userId} resource={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWorkload;
