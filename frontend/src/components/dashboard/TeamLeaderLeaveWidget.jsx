import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, User as UserIcon, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import api from '../../services/api';

const TeamLeaderLeaveWidget = ({ leaves, onRefresh }) => {
  const [processingId, setProcessingId] = useState(null);
  const [remarksMap, setRemarksMap] = useState({});
  const [message, setMessage] = useState(null);

  // Filter requests pending TL approval
  const pendingTLRequests = Array.isArray(leaves)
    ? leaves.filter(l => l && (l.status === 'PENDING_TL_APPROVAL' || l.status === 'PENDING'))
    : [];

  const handleTLApprove = async (id) => {
    try {
      setProcessingId(id);
      setMessage(null);
      await api.put(`/leaves/${id}/tl-approve`, { remarks: remarksMap[id] || 'Recommended by Team Leader' });
      setMessage({ type: 'success', text: 'Leave request approved and forwarded to Admin for final sanction!' });
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
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Team Member Leave Approvals</h3>
            <p className="text-xs text-muted-foreground font-medium">Review and recommend Intern & Employee leave applications within your team.</p>
          </div>
        </div>

        <div className="px-3.5 py-1 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex flex-col items-center justify-center text-center shrink-0 min-w-[70px] leading-tight">
          <span className="text-sm font-black leading-none">{pendingTLRequests.length}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider block mt-0.5 leading-none">Pending</span>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${message.type === 'error' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
          }`}>
          {message.text}
        </div>
      )}

      {pendingTLRequests.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60">
          No pending team leave requests requiring review.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTLRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl border border-border/70 bg-muted/20 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar user={req.user} className="h-10 w-10 rounded-xl" />
                  <div>
                    <span className="text-xs font-bold text-foreground block">{req.user?.name}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {req.user?.role} • {req.user?.department || 'General'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                    {req.leaveType || req.type || 'CASUAL'} ({req.totalDays || 1} Day{req.totalDays > 1 ? 's' : ''})
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold font-mono">
                    {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/40 text-xs space-y-1">
                <span className="font-bold text-foreground block uppercase text-[11px] tracking-wide">{req.leaveType || req.type || 'CASUAL'} Application</span>
                <p className="text-muted-foreground leading-relaxed text-[11px]">{req.reason || req.letterContent}</p>
                {req.contactPhone && (
                  <span className="text-[10px] text-muted-foreground font-semibold block pt-1">Contact: {req.contactPhone}</span>
                )}
              </div>

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
                    className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Approve & Forward</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamLeaderLeaveWidget;
