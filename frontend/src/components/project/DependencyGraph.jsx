import React, { useState } from 'react';
import { Lock, Unlock, ArrowDown, Trash2, Plus, ShieldCheck } from 'lucide-react';

export const DependencyGraph = ({ prerequisites = [], dependents = [], onDeleteDependency, onAddDependency, tasksList = [] }) => {
  const [selectedPrereqId, setSelectedPrereqId] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // tree or graph

  const allPrerequisitesCleared = prerequisites.every(
    p => p.dependsOnTask?.status === 'APPROVED' || p.dependsOnTask?.status === 'COMPLETED'
  );

  const handleAdd = (e) => {
    e.preventDefault();
    if (selectedPrereqId && onAddDependency) {
      onAddDependency(selectedPrereqId);
      setSelectedPrereqId('');
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Header controls & Status Badge */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div className="flex items-center gap-2">
          {allPrerequisitesCleared ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Unlock className="h-3.5 w-3.5" /> Dependencies Cleared
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <Lock className="h-3.5 w-3.5" /> Locked ({prerequisites.filter(p => p.dependsOnTask?.status !== 'APPROVED' && p.dependsOnTask?.status !== 'COMPLETED').length} Prerequisite(s) Open)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
              viewMode === 'tree' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
            }`}
          >
            Tree List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
              viewMode === 'graph' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
            }`}
          >
            Graph View
          </button>
        </div>
      </div>

      {/* Add Dependency Trigger Form */}
      {onAddDependency && tasksList.length > 0 && (
        <form onSubmit={handleAdd} className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/30">
          <select
            value={selectedPrereqId}
            onChange={(e) => setSelectedPrereqId(e.target.value)}
            className="flex-1 text-xs bg-card border border-border/50 rounded-lg px-3 py-1.5 font-medium"
          >
            <option value="">-- Add Prerequisite Task (Must Complete First) --</option>
            {tasksList.map(t => (
              <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!selectedPrereqId}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Link Prerequisite
          </button>
        </form>
      )}

      {viewMode === 'tree' ? (
        /* Tree List View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prerequisites Section */}
          <div className="space-y-2 p-3.5 rounded-xl bg-muted/20 border border-border/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-500" /> Depends On ({prerequisites.length})
            </h4>

            {prerequisites.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic py-3 text-center">No prerequisite tasks linked (Can start immediately).</p>
            ) : (
              <div className="space-y-2">
                {prerequisites.map(dep => {
                  const pTask = dep.dependsOnTask || {};
                  const isDone = pTask.status === 'APPROVED' || pTask.status === 'COMPLETED';
                  return (
                    <div key={dep.id} className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/30 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        {isDone ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span className={`truncate font-semibold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {pTask.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${isDone ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                          {pTask.status}
                        </span>
                        {onDeleteDependency && (
                          <button onClick={() => onDeleteDependency(dep.id)} className="text-muted-foreground hover:text-rose-500 p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dependents Section (Tasks blocked by this task) */}
          <div className="space-y-2 p-3.5 rounded-xl bg-muted/20 border border-border/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ArrowDown className="h-3.5 w-3.5 text-sky-500" /> Blocks ({dependents.length})
            </h4>

            {dependents.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic py-3 text-center">No other tasks are waiting on this task.</p>
            ) : (
              <div className="space-y-2">
                {dependents.map(dep => {
                  const dTask = dep.task || {};
                  return (
                    <div key={dep.id} className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/30 text-xs">
                      <span className="font-semibold text-foreground truncate">{dTask.title}</span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                        {dTask.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Visual Graph View */
        <div className="p-6 rounded-xl bg-card border border-border/30 flex flex-col items-center space-y-4">
          <div className="text-xs font-bold text-muted-foreground uppercase">PREREQUISITE TASKS</div>
          <div className="flex flex-wrap justify-center gap-2">
            {prerequisites.map(p => (
              <div key={p.id} className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400">
                {p.dependsOnTask?.title} ({p.dependsOnTask?.status})
              </div>
            ))}
            {prerequisites.length === 0 && <span className="text-xs text-muted-foreground italic">None (Root Task)</span>}
          </div>

          <ArrowDown className="h-5 w-5 text-primary animate-bounce" />

          <div className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md">
            CURRENT TASK WORKFLOW NODE
          </div>

          <ArrowDown className="h-5 w-5 text-primary animate-bounce" />

          <div className="text-xs font-bold text-muted-foreground uppercase">DEPENDENT TASKS (BLOCKED)</div>
          <div className="flex flex-wrap justify-center gap-2">
            {dependents.map(d => (
              <div key={d.id} className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-sky-600 dark:text-sky-400">
                {d.task?.title}
              </div>
            ))}
            {dependents.length === 0 && <span className="text-xs text-muted-foreground italic">None (Leaf Task)</span>}
          </div>
        </div>
      )}
    </div>
  );
};
