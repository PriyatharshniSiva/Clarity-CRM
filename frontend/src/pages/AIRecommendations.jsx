import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Zap, Filter, CheckCircle2, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { AIRecommendationCard } from '../components/ai';

const AIRecommendations = () => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [alertMsg, setAlertMsg] = useState('');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'ALL' ? '/ai/recommendations' : `/ai/recommendations?category=${selectedCategory}`;
      const res = await api.get(url);
      setRecommendations(res.data.recommendations || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedCategory]);

  const handleFeedback = async (recommendationId, rating, category) => {
    try {
      await api.post('/ai/feedback', { recommendationId, rating, category });
      setAlertMsg(`Submitted ${rating === 'HELPFUL' ? '👍 Helpful' : '👎 Not Helpful'} feedback. Thank you!`);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-amber-500" /> Actionable AI Recommendations Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            AI-generated recommendations categorized by Risk, Resource Allocation, Schedule Variance, and Dependencies.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-4 overflow-x-auto">
        {['ALL', 'RISK', 'RESOURCE', 'SCHEDULE', 'DEPENDENCY', 'QUALITY'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recommendation Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm font-bold animate-pulse">
          Filtering AI Recommendations...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-xs italic">
          No AI recommendations found for category "{selectedCategory}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map(r => (
            <AIRecommendationCard key={r.recommendationId} recommendation={r} onFeedback={handleFeedback} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;
