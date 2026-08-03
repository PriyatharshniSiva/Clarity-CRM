import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, User as UserIcon, AlertCircle, FileText, ChevronRight, Calendar } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TeamLeaderLeaveWidget = ({ leaves, onRefresh }) => {
  const { user: currentUser } = useAuth();
  const [processingId, setProcessingId] = useState(null);
  const [remarksMap, setRemarksMap] = useState({});
  const [message, setMessage] = useState(null);

  const safeLeaves = useMemo(() => Array.isArray(leaves) ? leaves : [], [leaves]);

  // Filter requests pending TL approval (strictly excluding TL's own leave requests)
  const pendingTLRequests = useMemo(() => {
    return safeLeaves.filter(l => {
      if (!l) return false;
      const isSelf = l.userId === currentUser?.id || l.user?.id === currentUser?.id;
      if (isSelf) return false;
      return l.status === 'PENDING_TL_APPROVAL' || l.status === 'PENDING';
    });
  }, [safeLeaves, currentUser]);

  // Count Pending, Approved Today, Rejected Today, On Leave Today (strictly for team members)
  const counts = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');

    const teamLeaves = safeLeaves.filter(l => {
      if (!l) return false;
      const isSelf = l.userId === currentUser?.id || l.user?.id === currentUser?.id;
      return !isSelf;
    });

    const approvedToday = teamLeaves.filter(l => l?.status === 'APPROVED' && new Date(l.updatedAt || l.createdAt).toLocaleDateString('en-CA') === todayStr).length;
    const rejectedToday = teamLeaves.filter(l => l?.status === 'REJECTED' && new Date(l.updatedAt || l.createdAt).toLocaleDateString('en-CA') === todayStr).length;
    const onLeaveToday = teamLeaves.filter(l => {
      if (l?.status !== 'APPROVED') return false;
      const start = new Date(l.startDate).toLocaleDateString('en-CA');
      const end = new Date(l.endDate || l.startDate).toLocaleDateString('en-CA');
      return todayStr >= start && todayStr <= end;
    }).length;

    return {
      pending: pendingTLRequests.length,
      approvedToday,
      rejectedToday,
      onLeaveToday
    };
  }, [safeLeaves, pendingTLRequests, currentUser]);

  const handleTLApprove = async (id) => {
    try {
      setProcessingId(id);
      setMessage(null);
      await api.put(`/leaves/${id}/tl-approve`, { remarks: remarksMap[id] || 'Recommended by Team Leader' });
      setMessage({ type: 'success', text: 'Leave request approved and forwarded for final sanction!' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve request.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleTLReject = async (id) => {
    try {
      setProcessingId(id);
      setMessage(null);
      await api.put(`/leaves/${id}/reject`, { remarks: remarksMap[id] || 'Declined by Team Leader' });
      setMessage({ type: 'success', text: 'Leave request declined.' });
      if (onRefresh) onRefresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to decline request.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm space-y-4 text-left font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Team Member Leave Approvals</h3>
            <p className="text-xs text-muted-foreground font-medium">Review and approve leave requests submitted by your team members.</p>
          </div>
        </div>

        <Link
          to="/leaves"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Summary Counters Bar (Pending | Approved Today | Rejected Today | On Leave Today) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
          <span className="text-base font-black block leading-none">{counts.pending}</span>
          <span className="text-[9px] font-extrabold uppercase mt-1 block">Pending</span>
        </div>
        <div className="p-2 rounded-2xl bg-success/10 border border-success/20 text-success">
          <span className="text-base font-black block leading-none">{counts.approvedToday}</span>
          <span className="text-[9px] font-extrabold uppercase mt-1 block">Approved Today</span>
        </div>
        <div className="p-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600">
          <span className="text-base font-black block leading-none">{counts.rejectedToday}</span>
          <span className="text-[9px] font-extrabold uppercase mt-1 block">Rejected Today</span>
        </div>
        <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600">
          <span className="text-base font-black block leading-none">{counts.onLeaveToday}</span>
          <span className="text-[9px] font-extrabold uppercase mt-1 block">On Leave Today</span>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${message.type === 'error' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-success/10 text-success border border-success/20'}`}>
          {message.text}
        </div>
      )}

      {pendingTLRequests.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60 font-semibold">
          No pending team member leave requests requiring approval.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTLRequests.map((req) => {
            const leaveTypeName = req.leaveType || req.type || 'CASUAL';
            const numDays = req.totalDays || 1;
            const empId = req.user?.employeeId || req.user?.internId || req.user?.id?.substring(0, 8) || 'EMP-1001';
            const startDateStr = req.startDate ? new Date(req.startDate).toLocaleDateString() : '';
            const endDateStr = req.endDate ? new Date(req.endDate).toLocaleDateString() : startDateStr;

            return (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-border/70 bg-muted/20 space-y-3"
              >
                {/* Employee Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={req.user} className="h-10 w-10 rounded-xl" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">{req.user?.name || 'Team Member'}</span>
                      <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                        ID: {empId} • {req.user?.role || 'EMPLOYEE'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                      {leaveTypeName} ({numDays} Day{numDays > 1 ? 's' : ''})
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {req.status}
                    </span>
                  </div>
                </div>

                {/* Details & Dates */}
                <div className="p-3 rounded-xl bg-card border border-border/40 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span className="uppercase text-foreground font-extrabold">{leaveTypeName} Application</span>
                    <span className="font-mono text-primary">{startDateStr} – {endDateStr}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">{req.reason || req.letterContent}</p>
                </div>

                {/* Actions & Remarks */}
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    placeholder="Optional review remarks..."
                    value={remarksMap[req.id] || ''}
                    onChange={(e) => setRemarksMap({ ...remarksMap, [req.id]: e.target.value })}
                    className="w-full bg-card border border-border/60 rounded-xl px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTLReject(req.id)}
                      disabled={processingId === req.id}
                      className="flex items-center justify-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTLApprove(req.id)}
                      disabled={processingId === req.id}
                      className="flex items-center justify-center gap-1 btn-primary py-2 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamLeaderLeaveWidget;
