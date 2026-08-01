import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Briefcase,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { DashboardMetricCard, ProductivityCard } from '../components/analytics';
import { ProjectStatusBadge } from '../components/project';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [dashRes, prodRes, schedRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/productivity'),
        api.get('/analytics/schedule')
      ]);

      setAnalytics(dashRes.data.summary || {});
      setProductivity(prodRes.data.productivity || {});
      setScheduleData(schedRes.data.schedule || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm font-bold animate-pulse">
        Loading Executive Analytics Dashboard...
      </div>
    );
  }

  const proj = analytics?.projects || {};
  const health = analytics?.health || {};
  const tasks = analytics?.tasks || {};
  const time = analytics?.time || {};
  const teams = analytics?.teams || {};

  return (
    <div className="flex-1 flex flex-col space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-primary" /> Enterprise Analytics & Performance
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Executive performance metrics, project health distribution, work velocity, and schedule performance.
          </p>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <DashboardMetricCard
          title="Total Projects"
          value={proj.total || 0}
          subtext={`${proj.active || 0} Active / ${proj.completed || 0} Completed`}
          icon={Briefcase}
          color="primary"
        />

        <DashboardMetricCard
          title="On Track"
          value={health.onTrack || 0}
          subtext="Healthy Projects"
          icon={CheckCircle2}
          color="emerald"
        />

        <DashboardMetricCard
          title="At Risk / Delayed"
          value={(health.atRisk || 0) + (health.delayed || 0)}
          subtext={`${health.delayed || 0} Past Deadline`}
          icon={AlertTriangle}
          color="rose"
        />

        <DashboardMetricCard
          title="Completed Tasks"
          value={tasks.completed || 0}
          subtext={`Out of ${tasks.total || 0} Total Tasks`}
          icon={Layers}
          color="sky"
        />

        <DashboardMetricCard
          title="Actual vs Estimated"
          value={`${time.actualHours || 0}h / ${time.estimatedHours || 0}h`}
          subtext={`Variance: ${time.variance > 0 ? `+${time.variance}` : time.variance}h`}
          icon={Clock}
          color="purple"
        />

        <DashboardMetricCard
          title="Team Productivity"
          value={`${teams.overallProductivityPercent || 0}%`}
          subtext={`${teams.totalMembers || 0} Active Members`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Productivity Card & Schedule Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {productivity && <ProductivityCard productivity={productivity} />}
        </div>

        {/* Schedule Performance & Velocity Table */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-white/70 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Schedule Performance & Milestone Velocity
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-2.5">Project</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Planned vs Delay</th>
                  <th className="p-2.5">Milestone Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {scheduleData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-muted-foreground italic">No projects found</td>
                  </tr>
                ) : (
                  scheduleData.slice(0, 5).map(p => (
                    <tr key={p.projectId} className="hover:bg-muted/10">
                      <td className="p-2.5 font-bold text-foreground">
                        [{p.projectCode}] {p.name}
                      </td>
                      <td className="p-2.5">
                        <ProjectStatusBadge status={p.status} health={p.health} />
                      </td>
                      <td className="p-2.5 font-mono">
                        {p.plannedDays}d planned {p.isDelayed ? <span className="text-rose-500 font-bold">({p.delayDays}d overdue)</span> : <span className="text-emerald-500 font-bold">(On Time)</span>}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-primary">
                        {p.completedMilestones}/{p.totalMilestones} ({p.milestoneVelocityPercent}%)
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
