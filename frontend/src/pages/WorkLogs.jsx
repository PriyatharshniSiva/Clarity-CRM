import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Clock,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  TrendingUp,
  Briefcase,
  CheckSquare
} from 'lucide-react';
import { WorkLogCard } from '../components/project';

const WorkLogs = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    hoursToday: 0,
    hoursThisWeek: 0,
    hoursThisMonth: 0,
    tasksWorkedOnCount: 0,
    avgHoursPerDay: '0.0'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [alertMsg, setAlertMsg] = useState('');

  // Log Work Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [projectsList, setProjectsList] = useState([]);
  const [tasksList, setTasksList] = useState([]);

  const [formData, setFormData] = useState({
    projectId: '',
    taskId: '',
    description: '',
    hoursWorked: '',
    workDate: new Date().toISOString().split('T')[0]
  });

  const fetchWorkLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/worklogs');
      setLogs(res.data.logs || []);
      setSummary(res.data.summary || {});
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch work logs:', err);
      setAlertMsg('Failed to load work logs.');
      setLoading(false);
    }
  };

  const fetchProjectsAndTasks = async () => {
    try {
      const pRes = await api.get('/projects');
      setProjectsList(pRes.data.projects || []);

      const tRes = await api.get('/tasks');
      setTasksList(tRes.data || []);
    } catch (err) {
      console.error('Failed to fetch projects/tasks for logging work:', err);
    }
  };

  useEffect(() => {
    fetchWorkLogs();
    fetchProjectsAndTasks();
  }, []);

  const openCreateModal = () => {
    setFormData({
      projectId: '',
      taskId: '',
      description: '',
      hoursWorked: '',
      workDate: new Date().toISOString().split('T')[0]
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/worklogs', formData);
      setAlertMsg(`Logged ${res.data.hoursWorked} hours successfully.`);
      setCreateModalOpen(false);
      fetchWorkLogs();
    } catch (err) {
      setAlertMsg(err.response?.data?.message || 'Failed to log work.');
    }
  };

  const openEditModal = (log) => {
    setSelectedLog(log);
    setFormData({
      projectId: log.projectId || '',
      taskId: log.taskId || '',
      description: log.description || '',
      hoursWorked: log.hoursWorked || '',
      workDate: new Date(log.workDate).toISOString().split('T')[0]
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/worklogs/${selectedLog.id}`, formData);
      setAlertMsg(`Updated work log #${res.data.id.substring(0, 6)} successfully.`);
      setEditModalOpen(false);
      fetchWorkLogs();
    } catch (err) {
      setAlertMsg(err.response?.data?.message || 'Failed to update work log.');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this work log?')) return;
    try {
      await api.delete(`/worklogs/${logId}`);
      setAlertMsg('Work log deleted successfully.');
      fetchWorkLogs();
    } catch (err) {
      setAlertMsg(err.response?.data?.message || 'Failed to delete work log.');
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (l.project && l.project.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (l.task && l.task.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (selectedStatus !== 'ALL' && l.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col space-y-6 text-left">
      {/* Alert Banner */}
      {alertMsg && (
        <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-2xl flex items-center justify-between animate-in fade-in duration-300">
          <span className="text-xs font-bold">{alertMsg}</span>
          <button onClick={() => setAlertMsg('')} className="text-primary hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-primary" /> Daily Work Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Log daily work hours, track actual time against estimates, and view activity summaries.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary-hover transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Log Work Hours
        </button>
      </div>

      {/* Dashboard Summary Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hours Today</div>
          <div className="text-2xl font-black text-primary font-mono">{summary.hoursToday} hrs</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-primary">This Week</div>
          <div className="text-2xl font-black text-primary font-mono">{summary.hoursThisWeek} hrs</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-sky-500">This Month</div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">{summary.hoursThisMonth} hrs</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-purple-500">Tasks Worked On</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{summary.tasksWorkedOnCount} Tasks</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/70 dark:border-white/10 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-amber-500">Avg Hours / Day</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{summary.avgHoursPerDay} hrs</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(st => (
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
            placeholder="Search work logs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Work Logs Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm font-bold animate-pulse">
          Loading daily work logs...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-border/40 p-8 space-y-3">
          <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h3 className="text-base font-bold text-foreground">No work logs found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Click "Log Work Hours" to log your tasks and daily progress.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLogs.map(log => (
            <WorkLogCard
              key={log.id}
              log={log}
              onEdit={openEditModal}
              onDelete={handleDeleteLog}
            />
          ))}
        </div>
      )}

      {/* Create / Edit WorkLog Modal */}
      {(createModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border/80 p-6 space-y-4 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> {editModalOpen ? 'Edit Work Log' : 'Log Daily Work Hours'}
              </h3>
              <button onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); }}>
                <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <form onSubmit={editModalOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Select Project (Optional)</label>
                  <select
                    value={formData.projectId}
                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs"
                  >
                    <option value="">-- No Project --</option>
                    {projectsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.projectCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Select Task (Optional)</label>
                  <select
                    value={formData.taskId}
                    onChange={e => setFormData({ ...formData, taskId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs"
                  >
                    <option value="">-- No Specific Task --</option>
                    {tasksList.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Hours Worked *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    required
                    placeholder="e.g. 4.5"
                    value={formData.hoursWorked}
                    onChange={e => setFormData({ ...formData, hoursWorked: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Work Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.workDate}
                    onChange={e => setFormData({ ...formData, workDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Work Description & Details *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe tasks completed, bugs fixed, or features built..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); }}
                  className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary-hover"
                >
                  {editModalOpen ? 'Save Changes' : 'Submit Work Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkLogs;
