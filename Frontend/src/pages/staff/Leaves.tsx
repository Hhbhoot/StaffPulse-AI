import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../api';
import toast from 'react-hot-toast';

export function StaffLeaves() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves/me');
      setLeaves(res.data.leaveRequests);
    } catch (err) {
      console.error('Failed to load leaves', err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leaves', {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason,
      });
      toast.success('Leave request submitted successfully!');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Leave Requests</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">
            Apply for Leave
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Start Date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm resize-none h-24"
                placeholder="Why do you need leave?"
              />
            </div>
            <Button type="submit" className="w-full" isLoading={loading}>
              Submit Request
            </Button>
          </form>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">
            Leave History
          </h2>
          <div className="space-y-4">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div>
                  <div className="font-medium text-white">
                    {new Date(leave.startDate).toLocaleDateString()} -{' '}
                    {new Date(leave.endDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    "{leave.reason}"
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    leave.status === 'APPROVED'
                      ? 'bg-green-500/10 text-green-400'
                      : leave.status === 'REJECTED'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                  }`}
                >
                  {leave.status}
                </div>
              </div>
            ))}
            {leaves.length === 0 && (
              <div className="text-slate-400 text-center py-4">
                You haven't submitted any leave requests yet.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
