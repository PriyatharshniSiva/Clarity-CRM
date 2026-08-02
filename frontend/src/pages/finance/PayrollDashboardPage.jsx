import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  DollarSign, TrendingUp, Users, Calendar, CheckCircle2, Clock,
  AlertCircle, ArrowUpRight, ArrowDownRight, ShieldCheck, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PayrollDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reportsRes, batchesRes] = await Promise.all([
        api.get('/payroll/reports/summary'),
        api.get('/payroll/batches')
      ]);
      setStats(reportsRes.data);
      setBatches(batchesRes.data);
    } catch (err) {
      console.error('Failed to load payroll dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 text-left font-sans w-full max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-100 text-sm font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" /> Enterprise Finance & Payroll Portal
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Payroll Executive Dashboard</h1>
            <p className="text-emerald-100 text-sm mt-1">
              Live financial overview, department costs, batch statuses, and payout analytics.
            </p>
          </div>
          {user?.role === 'SUPER_ADMIN' && (
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-white border border-white/30">
              Read-Only Super Admin Audit View
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <Clock className="w-6 h-6 animate-spin mr-2" /> Loading Financial Analytics...
          </div>
        ) : (
          <>
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Gross Payroll</span>
                  <span className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <DollarSign className="w-5 h-5" />
                  </span>
                </div>
                <div className="text-2xl font-black text-foreground">{formatINR(stats?.totalGrossExpense)}</div>
                <p className="text-xs text-muted-foreground">Cumulative gross expense across published batches</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Net Disbursements</span>
                  <span className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                </div>
                <div className="text-2xl font-black text-foreground">{formatINR(stats?.totalNetExpense)}</div>
                <p className="text-xs text-muted-foreground">Direct net payouts to employees & interns</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statutory Deductions (PF/ESI/Tax)</span>
                  <span className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                </div>
                <div className="text-2xl font-black text-foreground">{formatINR((stats?.totalPF || 0) + (stats?.totalESI || 0) + (stats?.totalTax || 0))}</div>
                <p className="text-xs text-muted-foreground">PF: {formatINR(stats?.totalPF)} | Tax: {formatINR(stats?.totalTax)}</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overtime & Holiday Pay</span>
                  <span className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </span>
                </div>
                <div className="text-2xl font-black text-foreground">{formatINR((stats?.totalOvertimePay || 0) + (stats?.totalHolidayPay || 0))}</div>
                <p className="text-xs text-muted-foreground">OT: {formatINR(stats?.totalOvertimePay)} | Holiday: {formatINR(stats?.totalHolidayPay)}</p>
              </div>
            </div>

            {/* Department Breakdown & Monthly Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Expense Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" /> Departmental Cost Breakdown
                </h3>
                <div className="space-y-4">
                  {stats?.departmentBreakdown?.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No department payroll data available yet.</p>
                  ) : (
                    stats?.departmentBreakdown?.map((dept, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{dept.department}</p>
                          <p className="text-xs text-muted-foreground">{dept.totalEmployees} employee(s) paid</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">{formatINR(dept.totalNet)}</p>
                          <p className="text-xs text-muted-foreground">Gross: {formatINR(dept.totalGross)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Monthly Batches Overview */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" /> Recent Payroll Batches
                </h3>
                <div className="space-y-3">
                  {batches.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No processed payroll batches found.</p>
                  ) : (
                    batches.slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3.5 border border-border/60 rounded-xl hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">Month {b.month} / {b.year}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              b.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              b.status === 'LOCKED' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                              'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{b.totalEmployees} employees • Processed by {b.processedBy?.name}</p>
                        </div>
                        <div className="text-right font-bold text-sm text-foreground">
                          {formatINR(b.totalNet)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
}
