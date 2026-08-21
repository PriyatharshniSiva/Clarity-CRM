import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Play, Lock, Eye, CheckCircle2, RotateCcw, Layers, Clock, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PayrollProcessingPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentBatch, setCurrentBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchBatchDetails();
  }, [selectedMonth, selectedYear]);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payroll/batches?month=${selectedMonth}&year=${selectedYear}`);
      if (res.data && res.data.length > 0) {
        const fullRes = await api.get(`/payroll/batch/${res.data[0].id}`);
        setCurrentBatch(fullRes.data);
      } else {
        setCurrentBatch(null);
      }
    } catch (err) {
      console.error('Failed to fetch batch details:', err);
      setCurrentBatch(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    try {
      setLoading(true);
      const res = await api.post('/payroll/process', {
        month: selectedMonth,
        year: selectedYear
      });
      setCurrentBatch(res.data);
      showToast('Automated payroll batch calculated and drafted successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to process payroll batch.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    if (!currentBatch) return;
    try {
      setLoading(true);
      const res = await api.put(`/payroll/batch/${currentBatch.id}/lock`);
      setCurrentBatch(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to lock batch.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!currentBatch) return;
    try {
      setLoading(true);
      const res = await api.put(`/payroll/batch/${currentBatch.id}/review`);
      setCurrentBatch(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to move batch to review.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!currentBatch) return;
    setConfirmModal({
      isOpen: true,
      title: 'Publish Payslips',
      message: 'Are you sure you want to publish payslips? This will generate official employee payslips.',
      action: async () => {
        try {
          setLoading(true);
          await api.put(`/payroll/batch/${currentBatch.id}/publish`);
          fetchBatchDetails();
          showToast('Payroll batch published successfully! All employee payslips are now available.');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to publish payslips.', 'error');
        } finally {
          setLoading(false);
          setConfirmModal({ isOpen: false, title: '', message: '', action: null });
        }
      }
    });
  };

  const handleRollback = async () => {
    if (!currentBatch) return;
    setConfirmModal({
      isOpen: true,
      title: 'Rollback Batch',
      message: 'WARNING: Rolling back will delete this draft/locked batch. Continue?',
      action: async () => {
        try {
          setLoading(true);
          await api.put(`/payroll/batch/${currentBatch.id}/rollback`);
          setCurrentBatch(null);
          showToast('Batch rolled back.');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to rollback batch.', 'error');
        } finally {
          setLoading(false);
          setConfirmModal({ isOpen: false, title: '', message: '', action: null });
        }
      }
    });
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const steps = [
    { title: 'Select Period', status: 'completed' },
    { title: 'Automated Calculation', status: currentBatch ? 'completed' : 'active' },
    { title: 'Lock Batch', status: currentBatch?.status === 'LOCKED' || currentBatch?.status === 'REVIEW' || currentBatch?.status === 'PUBLISHED' ? 'completed' : currentBatch?.status === 'PREVIEW' ? 'active' : 'pending' },
    { title: 'Audit & Review', status: currentBatch?.status === 'REVIEW' || currentBatch?.status === 'PUBLISHED' ? 'completed' : currentBatch?.status === 'LOCKED' ? 'active' : 'pending' },
    { title: 'Publish Payslips', status: currentBatch?.status === 'PUBLISHED' ? 'completed' : currentBatch?.status === 'REVIEW' ? 'active' : 'pending' }
  ];

  return (
    <div className="space-y-6 text-left font-sans w-full max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] p-4 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 ${notification.type === 'error'
              ? 'bg-rose-50 border-rose-500/30 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
              : 'bg-emerald-50 border-emerald-500/30 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
            }`}
        >
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" /> Payroll Processing Wizard
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

      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-center transition-all ${step.status === 'completed' ? 'bg-success/10 border-success/30 text-success font-bold' :
                  step.status === 'active' ? 'bg-primary/10 border-primary/30 text-primary font-bold shadow-sm' :
                    'bg-muted/30 border-border/60 text-muted-foreground'
                }`}
            >
              <span className="text-[10px] font-black uppercase block">Step {idx + 1}</span>
              <span className="text-xs font-extrabold">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-bold">Current Batch Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${currentBatch?.status === 'PUBLISHED' ? 'bg-success/10 text-success' :
                  currentBatch?.status === 'LOCKED' ? 'bg-warning/10 text-warning' :
                    currentBatch?.status === 'REVIEW' ? 'bg-secondary/10 text-secondary' :
                      currentBatch ? 'bg-primary/10 text-primary' :
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
                className="px-4 py-2 btn-primary font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Play className="w-4 h-4" /> {currentBatch ? 'Recalculate Batch' : 'Calculate & Draft Batch'}
              </button>
            )}

            {currentBatch?.status === 'PREVIEW' && (
              <button
                onClick={handleLock}
                disabled={loading}
                className="px-4 py-2 btn-primary font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Lock className="w-4 h-4" /> Lock Batch
              </button>
            )}

            {currentBatch?.status === 'LOCKED' && (
              <button
                onClick={handleReview}
                disabled={loading}
                className="px-4 py-2 btn-primary font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Eye className="w-4 h-4" /> Move to Review
              </button>
            )}

            {['LOCKED', 'REVIEW'].includes(currentBatch?.status) && (
              <button
                onClick={handlePublish}
                disabled={loading}
                className="px-4 py-2 btn-primary font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
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
                    <td className="p-3.5 text-muted-foreground">{formatINR(ps.hra + (JSON.parse(ps.allowancesString || '{}')?.specialAllowance || 0))}</td>
                    <td className="p-3.5 text-foreground">
                      <span className="font-semibold">{ps.presentDays}d present</span> / <span className="text-muted-foreground">{ps.paidLeaveDays}d leave</span>
                    </td>
                    <td className="p-3.5 text-primary font-semibold">
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
          <Clock className="w-8 h-8 mx-auto opacity-50 text-primary" />
          <p className="font-bold text-foreground">No Payroll Batch Processed for Month {selectedMonth} / {selectedYear}</p>
          <p className="text-xs">Click "Calculate & Draft Batch" above to run automated calculations.</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border shadow-xl rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
            <h3 className="font-bold text-lg">{confirmModal.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{confirmModal.message}</p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', action: null })} className="px-4 py-2 text-xs font-bold rounded-xl border border-border/50 hover:bg-muted text-muted-foreground transition-all">
                Cancel
              </button>
              <button onClick={confirmModal.action} className="px-4 py-2 text-xs font-bold rounded-xl btn-primary shadow-md">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
