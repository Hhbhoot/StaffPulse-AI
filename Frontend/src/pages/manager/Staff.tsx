import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Clock, Calendar, Activity } from 'lucide-react';

export function ManagerStaff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [selectedStaffDetails, setSelectedStaffDetails] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchStaff = async () => {
    const res = await api.get('/manager/staff');
    setStaff(res.data.staff);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/manager/staff', { name, email, password });
    setName('');
    setEmail('');
    setPassword('');
    setPassword('');
    fetchStaff();
  };

  const handleViewDetails = async (staffId: string) => {
    setIsModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/manager/staff/${staffId}`);
      setSelectedStaffDetails(res.data);
    } catch (error) {
      console.error('Error fetching staff details', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Team</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">
            Add Staff Member
          </h2>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              Create Staff
            </Button>
          </form>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Team Roster</h2>
          <div className="space-y-4">
            {staff.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div>
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-sm text-slate-400">{user.email}</div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleViewDetails(user.id)}
                  className="flex items-center gap-1 text-sm"
                >
                  View Details <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <GlassCard className="border border-white/10 shadow-2xl">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setTimeout(() => setSelectedStaffDetails(null), 300);
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {loadingDetails || !selectedStaffDetails ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-400">Loading profile...</p>
                  </div>
                ) : (
                  <div className="space-y-6 mt-2">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {selectedStaffDetails.staff.name}
                      </h2>
                      <p className="text-slate-400">
                        {selectedStaffDetails.staff.email}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-primary-400" />
                        <div className="text-xl font-bold text-white">
                          {selectedStaffDetails.stats.totalWorkingHours}h
                        </div>
                        <div className="text-xs text-slate-400">
                          Total Hours
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                        <Calendar className="w-6 h-6 mx-auto mb-2 text-green-400" />
                        <div className="text-xl font-bold text-white">
                          {selectedStaffDetails.stats.daysPresent}
                        </div>
                        <div className="text-xs text-slate-400">
                          Days Present
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                        <Activity className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                        <div className="text-xl font-bold text-white">
                          {selectedStaffDetails.stats.totalOvertimeHours}h
                        </div>
                        <div className="text-xs text-slate-400">Overtime</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Recent Attendance
                      </h3>
                      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <table className="w-full text-sm text-left text-slate-300">
                          <thead className="text-xs text-slate-400 uppercase bg-white/5">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Check In</th>
                              <th className="px-4 py-3">Check Out</th>
                              <th className="px-4 py-3 text-right">Hours</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedStaffDetails.attendance.map(
                              (record: any) => (
                                <tr
                                  key={record.id}
                                  className="border-b border-white/5 last:border-0 hover:bg-white/5"
                                >
                                  <td className="px-4 py-3">
                                    {new Date(
                                      record.createdAt
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    {new Date(
                                      record.checkIn
                                    ).toLocaleTimeString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    {record.checkOut ? (
                                      new Date(
                                        record.checkOut
                                      ).toLocaleTimeString()
                                    ) : (
                                      <span className="text-yellow-400">
                                        Active
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium">
                                    {record.workingHours
                                      ? `${record.workingHours}h`
                                      : '-'}
                                  </td>
                                </tr>
                              )
                            )}
                            {selectedStaffDetails.attendance.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-6 text-center text-slate-500"
                                >
                                  No recent attendance
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
