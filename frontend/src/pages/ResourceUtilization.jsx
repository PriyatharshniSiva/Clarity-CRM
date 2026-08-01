import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import { ResourceCard } from '../components/analytics';

const ResourceUtilization = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/resources');
      setSummary(res.data.summary || {});
      setResources(res.data.resources || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch resource analytics:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.role.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" /> Resource Utilization & Capacity
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Monitor team workload capacity, detect overallocated members, and balance resource distribution.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase">Total Resources</div>
          <div className="text-2xl font-black text-foreground font-mono">{summary.totalResources || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-primary uppercase">Balanced</div>
          <div className="text-2xl font-black text-primary font-mono">{summary.balancedCount || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-rose-500 uppercase">Overallocated</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{summary.overallocatedCount || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-amber-500 uppercase">Underutilized</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{summary.underutilizedCount || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Idle</div>
          <div className="text-2xl font-black text-slate-600 dark:text-slate-400 font-mono">{summary.idleCount || 0}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'BALANCED', 'OVERALLOCATED', 'UNDERUTILIZED', 'IDLE'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === st
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search member or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm font-bold animate-pulse">
          Loading resource capacity data...
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-xs italic">
          No resource capacity entries match your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(r => (
            <ResourceCard key={r.userId} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceUtilization;
