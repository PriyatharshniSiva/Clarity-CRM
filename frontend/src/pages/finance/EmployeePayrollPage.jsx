import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, FileCode, History, Eye, ShieldCheck, Download, Printer, X, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EmployeePayrollPage() {
  const { user } = useAuth();
  const [structure, setStructure] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchEmployeePayrollData();
  }, []);

  const fetchEmployeePayrollData = async () => {
    try {
      setLoading(true);
      const [structRes, revRes, psRes] = await Promise.all([
        api.get('/payroll/salary-structures/my'),
        api.get(`/payroll/salary-structures/revisions/${user.id}`),
        api.get('/payroll/payslips')
      ]);
      setStructure(structRes.data);
      setRevisions(revRes.data);
      setPayslips(psRes.data);
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = async (id) => {
    try {
      const res = await api.get(`/payroll/payslips/${id}`);
      setSelectedPayslip(res.data.payslip);
      setSettings(res.data.settings);
      setShowModal(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to view payslip.');
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 text-left font-sans w-full max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" /> Personal Compensation Portal
            </div>
            <h1 className="text-2xl font-black">{user?.name}'s Salary & Payslips</h1>
            <p className="text-emerald-100 text-xs mt-0.5">{user?.role} • {user?.department || 'Engineering'}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-100 block">Current Net Salary</span>
            <span className="text-2xl font-black text-white">{formatINR(structure?.netSalary)}</span>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading compensation details...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Itemized Structure */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Itemized Compensation Breakdown
              </h3>
              <div className="space-y-2 text-xs divide-y divide-border/60">
                <div className="pt-2 flex justify-between"><span>Basic Salary</span><span className="font-semibold text-foreground">{formatINR(structure?.basicSalary)}</span></div>
                <div className="pt-2 flex justify-between"><span>HRA</span><span className="font-semibold text-foreground">{formatINR(structure?.hra)}</span></div>
                <div className="pt-2 flex justify-between"><span>DA</span><span className="font-semibold text-foreground">{formatINR(structure?.da)}</span></div>
                <div className="pt-2 flex justify-between"><span>Special & Travel Allowances</span><span className="font-semibold text-foreground">{formatINR((structure?.specialAllowance || 0) + (structure?.travelAllowance || 0))}</span></div>
                <div className="pt-2 flex justify-between font-bold text-foreground"><span>Total Gross Pay</span><span>{formatINR(structure?.grossSalary)}</span></div>
                <div className="pt-2 flex justify-between text-muted-foreground"><span>PF ({formatINR(structure?.pfDeduction)}) + Tax ({formatINR(structure?.incomeTax)})</span><span>-{formatINR((structure?.pfDeduction || 0) + (structure?.incomeTax || 0) + (structure?.profTax || 0))}</span></div>
                <div className="pt-3 flex justify-between text-sm font-extrabold text-emerald-600 dark:text-emerald-400"><span>Monthly Net Pay</span><span>{formatINR(structure?.netSalary)}</span></div>
              </div>
            </div>

            {/* Payslips History */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-600" /> Published Monthly Payslips
              </h3>

              {payslips.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No published payslips available yet.</p>
              ) : (
                <div className="space-y-3">
                  {payslips.map(ps => (
                    <div key={ps.id} className="flex items-center justify-between p-4 border border-border/60 rounded-xl hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-bold text-foreground text-sm">Month {ps.month} / {ps.year} Payslip</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Working Days: {ps.workingDays}d • Present: {ps.presentDays}d • Paid Leave: {ps.paidLeaveDays}d</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatINR(ps.netSalary)}</p>
                          <p className="text-[10px] text-muted-foreground">Gross: {formatINR(ps.grossSalary)}</p>
                        </div>
                        <button
                          onClick={() => handleViewPayslip(ps.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> View / Print
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Viewer */}
        {showModal && selectedPayslip && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl print:p-0 print:border-none print:shadow-none">
              <div className="flex items-center justify-between pb-3 border-b border-border print:hidden">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-foreground text-base">My Official Payslip</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="px-3 py-1.5 border border-border hover:bg-muted rounded-lg font-bold text-xs flex items-center gap-1.5">
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                  <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-lg text-muted-foreground"><X className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 space-y-6 text-xs">
                <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{settings?.companyName || 'MRF Innovation Park Enterprise'}</h2>
                    <p className="text-slate-500 text-[11px] mt-0.5">{settings?.companyAddress || '100 Innovation Towers, Cyber City, Bangalore - 560001'}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black rounded text-[10px] uppercase">CONFIDENTIAL PAYSLIP</span>
                    <p className="text-slate-600 font-bold mt-1 text-sm">Month {selectedPayslip.month} / {selectedPayslip.year}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="text-slate-500 font-semibold">Employee Name: <span className="text-slate-900 font-bold">{selectedPayslip.user?.name}</span></p>
                    <p className="text-slate-500 font-semibold">Employee ID: <span className="text-slate-900 font-bold">{selectedPayslip.user?.employeeId || 'EMP-' + selectedPayslip.user?.id?.substring(0, 6)}</span></p>
                    <p className="text-slate-500 font-semibold">Role / Designation: <span className="text-slate-900 font-bold">{selectedPayslip.user?.role}</span></p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold">Department: <span className="text-slate-900 font-bold">{selectedPayslip.user?.department || 'General'}</span></p>
                    <p className="text-slate-500 font-semibold">Payment Method: <span className="text-slate-900 font-bold">Direct Bank Transfer</span></p>
                    <p className="text-slate-500 font-semibold">Pay Date: <span className="text-slate-900 font-bold">{settings?.payDay ? `${settings.payDay}th of Month` : '30th of Month'}</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 border-b border-slate-300 pb-1 text-xs">GROSS EARNINGS</h4>
                    <div className="flex justify-between text-slate-600"><span>Basic Salary</span><span className="font-semibold text-slate-900">{formatINR(selectedPayslip.basicSalary)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>HRA + DA</span><span className="font-semibold text-slate-900">{formatINR(selectedPayslip.hra + selectedPayslip.da)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Overtime Pay ({selectedPayslip.overtimeHours}h)</span><span className="font-semibold text-emerald-700">{formatINR(selectedPayslip.overtimePay)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Holiday Work Pay ({selectedPayslip.holidayDaysWorked}d)</span><span className="font-semibold text-emerald-700">{formatINR(selectedPayslip.holidayPay)}</span></div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 border-b border-slate-300 pb-1 text-xs">DEDUCTIONS</h4>
                    <div className="flex justify-between text-slate-600"><span>PF Contribution</span><span className="font-semibold text-slate-900">{formatINR(selectedPayslip.deductionsJson?.pfDeduction)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Professional Tax</span><span className="font-semibold text-slate-900">{formatINR(selectedPayslip.deductionsJson?.profTax)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Income Tax (TDS)</span><span className="font-semibold text-slate-900">{formatINR(selectedPayslip.deductionsJson?.incomeTax)}</span></div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">NET DISBURSEMENT AMOUNT</span>
                    <span className="text-2xl font-black text-emerald-900">{formatINR(selectedPayslip.netSalary)}</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <QrCode className="w-10 h-10 text-emerald-800" />
                    <div>
                      <span className="text-[9px] font-mono text-emerald-700 block">QR HASH: {selectedPayslip.qrCodeHash}</span>
                      <span className="text-[10px] font-bold text-emerald-800">Digitally Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
