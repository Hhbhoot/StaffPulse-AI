import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import api from '../../api';
import { Play, Square, Clock, Calendar, Activity } from 'lucide-react';

export function StaffDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    let interval: any;
    if (todayRecord && !todayRecord.checkOut) {
      const checkInTime = new Date(todayRecord.checkIn).getTime();
      const updateTimer = () => {
        const now = new Date().getTime();
        setElapsedSeconds(Math.floor((now - checkInTime) / 1000));
      };
      updateTimer(); // initial call
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [todayRecord]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fetchDashboardData = async () => {
    try {
      const [statsRes, attendanceRes] = await Promise.all([
        api.get('/attendance/me/stats'),
        api.get('/attendance/me?limit=1'),
      ]);
      setStats(statsRes.data.stats);
      setTodayRecord(statsRes.data.todayRecord || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-in');
      await fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-out');
      await fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  const isCheckedIn = todayRecord && !todayRecord.checkOut;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
        <p className="text-slate-400 text-lg">Manage your daily attendance</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium"
        >
          {error}
        </motion.div>
      )}

      <GlassCard className="flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              Today's Status
            </h2>
            <p className="text-slate-300 text-sm">
              {todayRecord
                ? `Checked in at ${new Date(todayRecord.checkIn).toLocaleTimeString()}`
                : 'You have not checked in today.'}
            </p>
          </div>

          {isCheckedIn && (
            <div className="bg-primary-500/10 border border-primary-500/20 px-6 py-3 rounded-xl flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
              </div>
              <div className="text-2xl font-mono font-bold text-white tracking-wider">
                {formatTime(elapsedSeconds)}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 relative z-10">
          <Button
            onClick={handleCheckIn}
            disabled={!!todayRecord}
            isLoading={actionLoading && !isCheckedIn}
            className="w-32 shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_30px_rgba(138,43,226,0.5)] transition-shadow"
          >
            <Play className="w-4 h-4 mr-2" />
            Check In
          </Button>
          <Button
            variant="danger"
            onClick={handleCheckOut}
            disabled={!isCheckedIn}
            isLoading={actionLoading && isCheckedIn}
            className="w-32 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-shadow"
          >
            <Square className="w-4 h-4 mr-2" />
            Check Out
          </Button>
        </div>
      </GlassCard>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="flex items-center gap-4">
            <div className="p-3 bg-primary-500/20 rounded-xl text-primary-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Hours (Month)</p>
              <h3 className="text-2xl font-bold text-white">
                {stats.totalHoursMonth}h
              </h3>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Days Present (Month)</p>
              <h3 className="text-2xl font-bold text-white">
                {stats.daysPresent}
              </h3>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Overtime (Month)</p>
              <h3 className="text-2xl font-bold text-white">
                {stats.totalOvertimeMonth}h
              </h3>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
