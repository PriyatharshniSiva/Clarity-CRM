import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Search,
  Filter,
  X,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  Eye,
  Check,
  CheckCircle,
  XCircle,
  Phone
} from 'lucide-react';

const AttendanceAudit = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalInterns: 0,
    presentToday: 0,
    lateToday: 0,
    halfDayToday: 0,
    absentToday: 0
  });

  const [loading, setLoading] = useState(false);

  // Filters
  const [userIdFilter, setUserIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown options
  const [allInterns, setAllInterns] = useState([]);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    clockIn: '',
    clockOut: '',
    status: '',
    workingHours: ''
  });

  const [alertMsg, setAlertMsg] = useState('');

  // Leaves sanction state
  const [subTab, setSubTab] = useState('Logs');
  const [leaves, setLeaves] = useState([]);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Letter view modal
  const [viewingLetter, setViewingLetter] = useState(null);

  const fetchAllLeaves = async () => {
    try {
      const res = await api.get('/leaves');
      setLeaves(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLeaveStatus = async (id, status) => {
    setSubmittingStatus(true);
    try {
      if (status === 'APPROVED') {
        await api.put(`/leaves/${id}/admin-approve`, { remarks: 'Sanctioned via Attendance Audit' });
      } else {
        await api.put(`/leaves/${id}/reject`, { remarks: 'Declined via Attendance Audit' });
      }
      const actionText = status === 'APPROVED' ? 'sanctioned & attendance updated' : 'declined';
      setAlertMsg(`Leave application letter successfully ${actionText}.`);
      fetchAllLeaves();
      fetchLogsAndAnalytics();
    } catch (err) {
      setAlertMsg(err.response?.data?.message || 'Failed to update leave request status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const res = await api.get('/users?limit=1000&status=ACTIVE');
      setAllInterns(res.data.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogsAndAnalytics = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        api.get('/attendance/logs', {
          params: {
            userId: userIdFilter,
            startDate,
            endDate
          }
        }),
        api.get('/attendance/analytics')
      ]);

      let logsData = logsRes.data;
      if (statusFilter) {
        logsData = logsData.filter(log => log.status === statusFilter);
      }

      setLogs(logsData);
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const formatLeavePeriod = (startDate, endDate) => {
    if (!startDate) return 'N/A';
    const startObj = new Date(startDate);
    const endObj = endDate ? new Date(endDate) : startObj;

    const startStr = startObj.toLocaleDateString();
    const endStr = endObj.toLocaleDateString();

    if (startStr === endStr) {
      return startStr;
    }
    return `${startStr} to ${endStr}`;
  };

  const getLeaveDurationDisplay = (l) => {
    if (l.totalDays !== undefined && l.totalDays !== null && Number(l.totalDays) > 0) {
      const days = Number(l.totalDays);
      return days === 1 ? '1 Day' : `${days} Days`;
    }
    if (!l.startDate) return '1 Day';
    const start = new Date(l.startDate);
    const end = l.endDate ? new Date(l.endDate) : start;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays === 1 ? '1 Day' : `${diffDays} Days`;
  };

  useEffect(() => {
    fetchUsersList();
    if (user.role === 'ADMIN') {
      fetchAllLeaves();
    }

    const pollInterval = setInterval(() => {
      if (user.role === 'ADMIN') {
        fetchAllLeaves();
      }
      fetchLogsAndAnalytics();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    fetchLogsAndAnalytics();
  }, [userIdFilter, statusFilter, startDate, endDate]);

  const openEditModal = (record) => {
    setSelectedRecord(record);
    setEditForm({
      clockIn: record.clockIn ? record.clockIn.split('.')[0] : '',
      clockOut: record.clockOut ? record.clockOut.split('.')[0] : '',
      status: record.status,
      workingHours: record.workingHours || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/attendance/${selectedRecord.id}`, {
        clockIn: editForm.clockIn || undefined,
        clockOut: editForm.clockOut || undefined,
        status: editForm.status,
        workingHours: editForm.workingHours ? parseFloat(editForm.workingHours) : undefined
      });
      setEditModalOpen(false);
      setSelectedRecord(null);
      setAlertMsg('Attendance log updated successfully.');
      fetchLogsAndAnalytics();
    } catch (err) {
      setAlertMsg('Failed to update attendance log.');
      setLoading(false);
    }
  };

  const renderLeavesApprovalTab = () => {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-premium text-left animate-in fade-in duration-300 space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-tight text-foreground/80 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Leave & WFH Application Letter Review Panel
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Accepting a letter assigns WFH for remote attendance. Declining a letter automatically marks the employee as ABSENT.
            </p>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
            {leaves.filter(l => ['PENDING_ADMIN_APPROVAL', 'PENDING_TL_APPROVAL', 'PENDING'].includes(l.status)).length} Pending Review
          </span>
        </div>

        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-muted-foreground uppercase border-b border-border/30 bg-muted/20 text-left whitespace-nowrap">
                <th className="px-6 py-4 whitespace-nowrap">Applicant</th>
                <th className="px-6 py-4 whitespace-nowrap">Leave Type</th>
                <th className="px-6 py-4 whitespace-nowrap">Duration</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Read Letter</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/25">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground whitespace-nowrap">
                    No leave or WFH application letters submitted.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/10 transition-all text-xs whitespace-nowrap">
                    <td className="px-6 py-4 font-semibold whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{l.user?.name}</span>
                        <span className="text-[10px] text-muted-foreground">{l.user?.employeeId} ({l.user?.role?.replace('_', ' ')})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-extrabold font-mono uppercase shadow-2xs ${
                        (l.leaveType || l.type) === 'WFH'
                          ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                          : (l.leaveType || l.type) === 'SICK'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : (l.leaveType || l.type) === 'EMERGENCY'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        {l.leaveType || l.type || 'CASUAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground text-sm">
                      {getLeaveDurationDisplay(l)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setViewingLetter(l)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 px-3.5 py-1.5 rounded-xl border border-primary/20 transition-all active:scale-95 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Read Letter</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {['PENDING_ADMIN_APPROVAL', 'PENDING_TL_APPROVAL', 'PENDING'].includes(l.status) ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleUpdateLeaveStatus(l.id, 'APPROVED')}
                            disabled={submittingStatus}
                            className="h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md hover:scale-110 transition-all cursor-pointer disabled:opacity-50"
                            title="Accept & Sanction Leave Application"
                          >
                            <Check className="h-4 w-4 stroke-[3]" />
                          </button>
                          <button
                            onClick={() => handleUpdateLeaveStatus(l.id, 'REJECTED')}
                            disabled={submittingStatus}
                            className="h-8 w-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md hover:scale-110 transition-all cursor-pointer disabled:opacity-50"
                            title="Decline Leave Application"
                          >
                            <X className="h-4 w-4 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-right">
                          {l.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                              <span>Sanctioned</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              <X className="h-3.5 w-3.5 stroke-[3]" />
                              <span>Declined</span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {alertMsg && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg('')}>✕</button>
        </div>
      )}

      {/* Sub-tabs navigation at the top */}
      {user.role === 'ADMIN' && (
        <div className="flex border-b border-border/20 gap-6">
          <button
            onClick={() => setSubTab('Logs')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative ${subTab === 'Logs' ? 'text-primary font-black' : 'text-muted-foreground hover:text-foreground font-semibold'}`}
          >
            Attendance Audit Logs
            {subTab === 'Logs' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />}
          </button>
          <button
            onClick={() => setSubTab('Leaves')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative ${subTab === 'Leaves' ? 'text-primary font-black' : 'text-muted-foreground hover:text-foreground font-semibold'}`}
          >
            Sanction WFH & Leaves ({leaves.filter(l => l.status === 'PENDING').length})
            {subTab === 'Leaves' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />}
          </button>
        </div>
      )}

      {subTab === 'Logs' ? (
        <>
          {/* Analytics widgets row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-left">
            <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-premium">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Active Members</span>
              <p className="text-lg font-extrabold mt-1">{stats.totalInterns}</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-premium">
              <span className="text-[10px] font-bold text-success uppercase">Present / WFH</span>
              <p className="text-lg font-extrabold mt-1">{stats.presentToday}</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-premium">
              <span className="text-[10px] font-bold text-warning uppercase">Late Arrivals</span>
              <p className="text-lg font-extrabold mt-1">{stats.lateToday}</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-premium">
              <span className="text-[10px] font-bold text-primary uppercase">Half Day</span>
              <p className="text-lg font-extrabold mt-1">{stats.halfDayToday}</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-premium col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-danger uppercase">Absent Today</span>
              <p className="text-lg font-extrabold mt-1">{stats.absentToday}</p>
            </div>
          </div>

          {/* Filter panel */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-card p-4 rounded-2xl border border-border/40 shadow-premium">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              <select value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} className="bg-muted/40 text-xs border rounded-xl px-3 py-2">
                <option value="">All Members</option>
                {allInterns.map(intern => (
                  <option key={intern.id} value={intern.id}>{intern.name} ({intern.employeeId})</option>
                ))}
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-muted/40 text-xs border rounded-xl px-3 py-2">
                <option value="">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
                <option value="WORK_FROM_HOME">Work From Home</option>
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="bg-muted/40 text-xs border rounded-xl px-3 py-1.5"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-muted-foreground text-xs">to</span>
                <input
                  type="date"
                  className="bg-muted/40 text-xs border rounded-xl px-3 py-1.5"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-border/40 bg-card shadow-premium text-left">
            <table className="w-full min-w-[1100px] text-sm border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-muted-foreground uppercase border-b border-border/30 bg-muted/20 whitespace-nowrap">
                  <th className="px-6 py-4 whitespace-nowrap">Members</th>
                  <th className="px-6 py-4 whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 whitespace-nowrap">Clock In</th>
                  <th className="px-6 py-4 whitespace-nowrap">Clock Out</th>
                  <th className="px-6 py-4 whitespace-nowrap">Hours</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap">Telemetry IP & Device</th>
                  <th className="px-6 py-4 whitespace-nowrap">Location Signature</th>
                  {user.role === 'ADMIN' && <th className="px-6 py-4 text-right whitespace-nowrap">Edit</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/25">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={user.role === 'ADMIN' ? 9 : 8} className="px-6 py-10 text-center text-muted-foreground whitespace-nowrap">
                      No attendance logs match selected filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/10 transition-all text-xs whitespace-nowrap">
                      <td className="px-6 py-4 font-semibold whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-sm">{log.user?.name}</span>
                          <span className="text-[10px] text-muted-foreground">{log.user?.employeeId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium whitespace-nowrap">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-mono whitespace-nowrap">{new Date(log.clockIn).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 font-mono whitespace-nowrap">
                        {log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : 'Shift Active'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{log.workingHours ? `${log.workingHours} hrs` : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${log.status === 'PRESENT' || log.status === 'WORK_FROM_HOME' ? 'bg-emerald-500/10 text-emerald-600' : log.status === 'LATE' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-500'}`}>
                          {log.status} {log.lateMinutes ? `(${log.lateMinutes}m late)` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-mono">{log.ipAddress || '127.0.0.1'}</span>
                          <span className="text-[10px] text-muted-foreground">{log.browser || 'Browser'} ({log.device || 'Desktop'})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate whitespace-nowrap" title={log.clockInLocation}>
                        {log.clockInLocation || '—'}
                      </td>
                      {user.role === 'ADMIN' && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button className="text-primary hover:text-primary-hover p-1 rounded hover:bg-muted" onClick={() => openEditModal(log)}>
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        renderLeavesApprovalTab()
      )}

      {/* View Full Formal Letter Modal for Admin */}
      {viewingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-xl rounded-2xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold">Formal Leave Application Letter</h3>
              </div>
              <button
                className="rounded-lg p-1 hover:bg-muted"
                onClick={() => setViewingLetter(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 font-sans text-xs">
              <div className="flex justify-between items-center bg-muted/40 p-3.5 rounded-xl border border-border/30">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">Applicant Employee</span>
                  <p className="font-bold text-sm text-foreground">{viewingLetter.user?.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{viewingLetter.user?.employeeId} ({viewingLetter.user?.role?.replace('_', ' ')})</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">Leave Type</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold font-mono uppercase ${
                    (viewingLetter.leaveType || viewingLetter.type) === 'WFH' ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  }`}>
                    {viewingLetter.leaveType || viewingLetter.type || 'CASUAL'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border border-border/30">
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Duration</span>
                  <p className="font-black text-foreground text-sm">{getLeaveDurationDisplay(viewingLetter)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Start & End Dates</span>
                  <p className="font-medium text-foreground text-xs">{formatLeavePeriod(viewingLetter.startDate, viewingLetter.endDate)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Reason / Application Letter</span>
                <div className="bg-muted/10 p-4 rounded-xl border border-border/40 text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-medium text-foreground">
                  {viewingLetter.reason || viewingLetter.letterContent}
                </div>
              </div>

              {viewingLetter.contactPhone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span>Contact Phone: <strong className="text-foreground">{viewingLetter.contactPhone}</strong></span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
              <button
                onClick={() => setViewingLetter(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border hover:bg-muted"
              >
                Close
              </button>

              {['PENDING_ADMIN_APPROVAL', 'PENDING_TL_APPROVAL', 'PENDING'].includes(viewingLetter.status) ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const id = viewingLetter.id;
                      setViewingLetter(null);
                      handleUpdateLeaveStatus(id, 'APPROVED');
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>Accept (Sanction)</span>
                  </button>

                  <button
                    onClick={() => {
                      const id = viewingLetter.id;
                      setViewingLetter(null);
                      handleUpdateLeaveStatus(id, 'REJECTED');
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="h-4 w-4 stroke-[3]" />
                    <span>Decline (Reject)</span>
                  </button>
                </div>
              ) : (
                <div>
                  {viewingLetter.status === 'APPROVED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Sanctioned</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      <X className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Declined</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit attendance log override modal */}
      {editModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-base font-bold">Edit Log: {selectedRecord.user?.name}</h3>
              <button className="rounded-lg p-1 hover:bg-muted" onClick={() => {
                setEditModalOpen(false);
                setSelectedRecord(null);
              }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Clock In Time</label>
                <input
                  type="datetime-local"
                  value={editForm.clockIn}
                  onChange={(e) => setEditForm({ ...editForm, clockIn: e.target.value })}
                  className="bg-background border px-3 py-2 rounded-xl text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Clock Out Time</label>
                <input
                  type="datetime-local"
                  value={editForm.clockOut}
                  onChange={(e) => setEditForm({ ...editForm, clockOut: e.target.value })}
                  className="bg-background border px-3 py-2 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Hours Worked Override</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 8.5"
                    value={editForm.workingHours}
                    onChange={(e) => setEditForm({ ...editForm, workingHours: e.target.value })}
                    className="bg-background border px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Attendance Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="bg-background border px-3 py-2 rounded-xl text-xs"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent</option>
                    <option value="WORK_FROM_HOME">Work From Home</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover active:scale-95 disabled:opacity-50">
                Override Log Details
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceAudit;
