import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../../services/api';
import {
  Wrench,
  FileCode,
  ListTree,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  GitBranch,
  Shield,
  Bell,
  Workflow,
  LayoutGrid,
  FileSpreadsheet
} from 'lucide-react';
import UniversalFormBuilder from './UniversalFormBuilder';
import NestedMenuBuilder from './NestedMenuBuilder';

export const PlatformBuilderDashboard = ({ defaultTab }) => {
  const location = useLocation();

  // Determine active view mode based on sub-route or prop
  const getActiveTab = () => {
    if (defaultTab) return defaultTab;
    const path = location.pathname;
    if (path.endsWith('/forms')) return 'forms';
    if (path.endsWith('/menus')) return 'menus';
    if (path.endsWith('/audit')) return 'audit';
    if (path.endsWith('/extensions')) return 'extensions';
    return 'forms';
  };

  const activeTab = getActiveTab();

  const [metrics, setMetrics] = useState({
    publishedVersionsCount: 0,
    totalFieldsCount: 0,
    totalMenuRules: 0,
    activeEntitiesCount: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/platform-builder/dashboard');
      setMetrics(res.data.metrics);
      setRecentLogs(res.data.recentLogs || []);
    } catch (err) {
      console.error('Fetch builder dashboard metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Page Header (Horizontal Navigation Tabs Removed) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary text-white shadow-md shadow-primary/20">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Builder Hub</h1>
            <p className="text-xs text-muted-foreground">
              Low-Code Enterprise Configuration Center for Super Admins.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Published Schemas</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{metrics.publishedVersionsCount}</h3>
            <span className="text-[11px] text-primary font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3 w-3" /> Live Production Enforced
            </span>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <GitBranch className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Dynamic Fields</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{metrics.totalFieldsCount}</h3>
            <span className="text-[11px] text-blue-500 font-medium mt-1 inline-block">
              19 Supported Field Types
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <FileCode className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Role Navigation Rules</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{metrics.totalMenuRules}</h3>
            <span className="text-[11px] text-purple-500 font-medium mt-1 inline-block">
              Configured Role Sidebar Items
            </span>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
            <ListTree className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Versioning Engine</p>
            <h3 className="text-2xl font-black text-foreground mt-1">Active</h3>
            <span className="text-[11px] text-secondary font-medium mt-1 inline-block">
              Draft / Impact / Rollback
            </span>
          </div>
          <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
            <Shield className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Dynamic View Rendering based on Sidebar Submenu Route */}
      {activeTab === 'forms' && <UniversalFormBuilder />}

      {activeTab === 'menus' && <NestedMenuBuilder />}

      {(activeTab === 'dashboard' || activeTab === 'audit') && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Platform Configuration Audit Log</span>
          </h3>

          {recentLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No builder history activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary/10 text-primary">
                        {log.builderType} - {log.action}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{log.details}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Performed by <span className="font-medium text-foreground">{log.performedBy?.name || 'Super Admin'}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'extensions' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 w-fit mb-3">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Phase 3: Dynamic Dashboard Builder</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Configure drag-and-drop dashboard widgets, KPIs, charts, and quick actions per role.
            </p>
            <span className="inline-block mt-3 px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Planned Next Phase
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 w-fit mb-3">
              <Workflow className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Phase 4: Dynamic Workflow Builder</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Construct multi-step approval flows, automated emails, status transitions, and triggers.
            </p>
            <span className="inline-block mt-3 px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
              Planned Phase 4
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 w-fit mb-3">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Phase 5: Dynamic Permission Matrix</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Fine-grained button, page, API, and row-level authorization rule matrix.
            </p>
            <span className="inline-block mt-3 px-2.5 py-1 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
              Planned Phase 5
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit mb-3">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Phase 6: Notification Builder</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Email, SMS, WhatsApp, and push notification template engine with dynamic variables.
            </p>
            <span className="inline-block mt-3 px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Planned Phase 6
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 w-fit mb-3">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Phase 7: Dynamic Report Builder</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Custom report generator, chart builder, and Excel/PDF export scheduler.
            </p>
            <span className="inline-block mt-3 px-2.5 py-1 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Planned Phase 7
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 w-fit mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Phase 8: AI Builder & Insights</h3>
            <p className="text-xs text-muted-foreground mt-1">
              AI recommendation engine, automated task generation, and predictive analytics.
            </p>
            <span className="inline-block mt-3 px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Planned Phase 8
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformBuilderDashboard;
