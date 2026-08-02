import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Layers, Play, Lock, Eye, CheckCircle2, RotateCcw, AlertTriangle, Clock } from 'lucide-react';

export default function PayrollProcessingPage() {
  const [selectedMonth, setSelectedMonth] = useState(11);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBatch();
  }, [selectedMonth, selectedYear]);

  const fetchBatch = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll/batches');
      const found = res.data.find(b => b.month === Number(selectedMonth) && b.year === Number(selectedYear));
      if (found) {
        const detailRes = await api.get(`/payroll/batch/${found.id}`);
        setCurrentBatch(detailRes.data);
      } else {
        setCurrentBatch(null);
      }
    } catch (err) {
      console.error('Failed to fetch payroll batch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    try {
      setLoading(true);
      const res = await api.post('/payroll/process', {
        month: Number(selectedMonth),
        year: Number(selectedYear)
      });
      setCurrentBatch(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process payroll batch.');
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    if (!currentBatch) return;
    try {
      setLoading(true);
      const res = await api.put(`/payroll/batch/${currentBatch.id}/lock`);
      fetchBatch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to lock batch.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!currentBatch) return;
    try {
      setLoading(true);
      await api.put(`/payroll/batch/${currentBatch.id}/review`);
      fetchBatch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update review status.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!currentBatch) return;
    if (!window.confirm('Publishing will lock edits permanently and issue payslips to all employees. Continue?')) return;
    try {
      setLoading(true);
      await api.put(`/payroll/batch/${currentBatch.id}/publish`);
      fetchBatch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish batch.');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!currentBatch) return;
    if (!window.confirm('WARNING: Rollback will set batch status to ROLLED_BACK. Continue?')) return;
    try {
      setLoading(true);
      await api.put(`/payroll/batch/${currentBatch.id}/rollback`);
      fetchBatch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rollback batch.');
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const steps = [
    { title: 'Draft / Select', status: currentBatch ? 'completed' : 'active' },
    { title: 'Calculation Preview', status: currentBatch?.status === 'PREVIEW' ? 'active' : currentBatch ? 'completed' : 'pending' },
    { title: 'Lock Batch', status: currentBatch?.status === 'LOCKED' ? 'active' : ['REVIEW', 'PUBLISHED', 'COMPLETED'].includes(currentBatch?.status) ? 'completed' : 'pending' },
    { title: 'Financial Review', status: currentBatch?.status === 'REVIEW' ? 'active' : ['PUBLISHED', 'COMPLETED'].includes(currentBatch?.status) ? 'completed' : 'pending' },
    { title: 'Publish Payslips', status: ['PUBLISHED', 'COMPLETED'].includes(currentBatch?.status) ? 'completed' : 'pending' }
  ];

  return (
    <div className="space-y-6 text-left font-sans w-full max-w-7xl mx-auto">
        {/* Banner */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Layers className="w-6 h-6 text-emerald-600" /> Payroll Processing Wizard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select month, execute automated calculations from Attendance & Leaves, preview batch, lock, review, and publish.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-xl border border-border">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Month</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="bg-background border border-border rounded-lg text-xs font-bold px-2 py-1 text-foreground"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Month {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Year</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-background border border-border rounded-lg text-xs font-bold px-2 py-1 text-foreground"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workflow Progress Steps */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-center transition-all ${
                  step.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold' :
                  step.status === 'active' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold shadow-sm' :
                  'bg-muted/30 border-border/60 text-muted-foreground'
                }`}
              >
                <span className="text-[10px] font-black uppercase block">Step {idx + 1}</span>
                <span className="text-xs font-extrabold">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-bold">Current Batch Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  currentBatch?.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  currentBatch?.status === 'LOCKED' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                  currentBatch?.status === 'REVIEW' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                  currentBatch ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {currentBatch?.status || 'NO BATCH DRAFTED'}
                </span>
                {currentBatch && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {currentBatch.totalEmployees} employee(s) • Total Net: {formatINR(currentBatch.totalNet)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(!currentBatch || ['PREVIEW', 'DRAFT'].includes(currentBatch?.status)) && (
                <button
                  onClick={handleProcess}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-4 h-4" /> {currentBatch ? 'Recalculate Batch' : 'Calculate & Draft Batch'}
                </button>
              )}

              {currentBatch?.status === 'PREVIEW' && (
                <button
                  onClick={handleLock}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Lock className="w-4 h-4" /> Lock Batch
                </button>
              )}

              {currentBatch?.status === 'LOCKED' && (
                <button
                  onClick={handleReview}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-4 h-4" /> Move to Review
                </button>
              )}

              {['LOCKED', 'REVIEW'].includes(currentBatch?.status) && (
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Publish Payslips
                </button>
              )}

              {currentBatch && currentBatch.status !== 'ROLLED_BACK' && (
                <button
                  onClick={handleRollback}
                  disabled={loading}
                  className="px-3 py-2 border border-destructive/40 text-destructive hover:bg-destructive/10 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Rollback
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payslip Items Table */}
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading batch details...</p>
        ) : currentBatch?.payslips?.length > 0 ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm">Batch Itemized Payslips ({currentBatch.payslips.length})</h3>
              <span className="text-xs text-muted-foreground font-semibold">
                Gross: {formatINR(currentBatch.totalGross)} | Deductions: {formatINR(currentBatch.totalDeductions)} | Net: {formatINR(currentBatch.totalNet)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Basic</th>
                    <th className="p-3.5">HRA / Allowances</th>
                    <th className="p-3.5">Present / Paid Leave</th>
                    <th className="p-3.5">Overtime / Holiday Pay</th>
                    <th className="p-3.5">Deductions</th>
                    <th className="p-3.5 text-right">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {currentBatch.payslips.map(ps => (
                    <tr key={ps.id} className="hover:bg-muted/30">
                      <td className="p-3.5">
                        <p className="font-bold text-foreground">{ps.user?.name}</p>
                        <p className="text-[11px] text-muted-foreground">{ps.user?.role} • {ps.user?.email}</p>
                      </td>
                      <td className="p-3.5 font-semibold">{formatINR(ps.basicSalary)}</td>
                      <td className="p-3.5 text-muted-foreground">{formatINR(ps.hra + (ps.allowancesJson?.specialAllowance || 0))}</td>
                      <td className="p-3.5 text-foreground">
                        <span className="font-semibold">{ps.presentDays}d present</span> / <span className="text-muted-foreground">{ps.paidLeaveDays}d leave</span>
                      </td>
                      <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        +{formatINR(ps.overtimePay + ps.holidayPay)}
                        <span className="text-[10px] text-muted-foreground block">{ps.overtimeHours}h OT • {ps.holidayDaysWorked}d Holiday</span>
                      </td>
                      <td className="p-3.5 text-destructive font-semibold">
                        -{formatINR(ps.grossSalary - ps.netSalary)}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-sm text-foreground">
                        {formatINR(ps.netSalary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground space-y-2">
            <Clock className="w-8 h-8 mx-auto opacity-50 text-emerald-600" />
            <p className="font-bold text-foreground">No Payroll Batch Processed for Month {selectedMonth} / {selectedYear}</p>
            <p className="text-xs">Click "Calculate & Draft Batch" above to run automated calculations.</p>
          </div>
        )}
      </div>
  );
}
