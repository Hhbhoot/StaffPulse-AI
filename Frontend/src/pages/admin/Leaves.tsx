import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import api from '../../api';

export function AdminLeaves() {
  const [leaves, setLeaves] = useState<any[]>([]);

  const fetchLeaves = async () => {
    const res = await api.get('/admin/all-leaves');
    setLeaves(res.data.leaveRequests);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/admin/leaves/${id}/status`, { status });
    fetchLeaves();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">System Leave Approvals</h1>

      <GlassCard>
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div>
                <div className="font-medium text-white">
                  {leave.user.name}{' '}
                  <span className="text-sm text-slate-400">
                    ({leave.user.email}) - {leave.user.role}
                  </span>
                </div>
                <div className="text-sm text-slate-300 mt-1">
                  {new Date(leave.startDate).toLocaleDateString()} -{' '}
                  {new Date(leave.endDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  "{leave.reason}"
                </div>
                <div className="mt-2 text-xs font-semibold text-primary-400">
                  {leave.status}
                </div>
              </div>
              {leave.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateStatus(leave.id, 'APPROVED')}
                    className="bg-green-500 hover:bg-green-600 shadow-green-500/30"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => updateStatus(leave.id, 'REJECTED')}
                    variant="danger"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
          {leaves.length === 0 && (
            <div className="text-slate-400 text-center py-4">
              No leave requests in the system.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
