import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../api';
import { Plus, X, ChevronRight, Clock, Calendar, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  const [managerId, setManagerId] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newManagerId, setNewManagerId] = useState('');
  const [updatingManager, setUpdatingManager] = useState(false);

  const fetchUsers = () => {
    api.get('/admin/users').then((res) => setUsers(res.data.users));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/admin/users', {
        name,
        email,
        password,
        role,
        ...(role === 'STAFF' && managerId ? { managerId } : {}),
      });
      setSuccess('User created successfully');
      setName('');
      setEmail('');
      setPassword('');
      setRole('STAFF');
      setManagerId('');
      fetchUsers();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewDetails = async (userId: string) => {
    setIsDetailsModalOpen(true);
    setLoadingDetails(true);
    setNewManagerId('');
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUserDetails(res.data);
    } catch (err: any) {
      toast.error('Failed to load user details');
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateManager = async () => {
    if (!selectedUserDetails) return;
    setUpdatingManager(true);
    try {
      await api.post('/admin/assign-manager', {
        staffId: selectedUserDetails.user.id,
        managerId: newManagerId,
      });
      toast.success('Manager updated successfully');
      // Refresh details
      const res = await api.get(`/admin/users/${selectedUserDetails.user.id}`);
      setSelectedUserDetails(res.data);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update manager');
    } finally {
      setUpdatingManager(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white mb-2">System Users</h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create User
        </Button>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-white/5 rounded-t-xl">
              <tr>
                <th className="px-4 py-4 rounded-tl-xl">Name</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Joined</th>
                <th className="px-4 py-4 rounded-tr-xl"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-4 font-medium text-white">{u.name}</td>
                  <td className="px-4 py-4">{u.email}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        u.role === 'ADMIN'
                          ? 'bg-red-500/20 text-red-400'
                          : u.role === 'MANAGER'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleViewDetails(u.id)}
                      className="text-xs py-1"
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-4 border-t border-white/10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-white bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-white bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </GlassCard>

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
              className="relative w-full max-w-md"
            >
              <GlassCard className="border border-white/10 shadow-2xl">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-white mb-6">
                  Create New User
                </h2>
                {error && (
                  <div className="text-red-400 mb-4 text-sm">{error}</div>
                )}
                {success && (
                  <div className="text-green-400 mb-4 text-sm">{success}</div>
                )}
                <form onSubmit={handleCreateUser} className="space-y-4">
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
                  <div className="flex flex-col space-y-1.5 w-full">
                    <label className="text-sm font-medium text-slate-300">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="glass-input rounded-xl px-4 py-2.5 text-sm transition-all duration-200"
                    >
                      <option value="STAFF" className="bg-slate-900">
                        Staff
                      </option>
                      <option value="MANAGER" className="bg-slate-900">
                        Manager
                      </option>
                      <option value="ADMIN" className="bg-slate-900">
                        Admin
                      </option>
                    </select>
                  </div>

                  {role === 'STAFF' && (
                    <div className="flex flex-col space-y-1.5 w-full">
                      <label className="text-sm font-medium text-slate-300">
                        Assign Manager (Optional)
                      </label>
                      <select
                        value={managerId}
                        onChange={(e) => setManagerId(e.target.value)}
                        className="glass-input rounded-xl px-4 py-2.5 text-sm transition-all duration-200"
                      >
                        <option value="" className="bg-slate-900">
                          -- Select a Manager --
                        </option>
                        {users
                          .filter((u) => u.role === 'MANAGER')
                          .map((manager) => (
                            <option
                              key={manager.id}
                              value={manager.id}
                              className="bg-slate-900"
                            >
                              {manager.name} ({manager.email})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsModalOpen(false)}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="w-full">
                      Create User
                    </Button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailsModalOpen && (
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
                    setIsDetailsModalOpen(false);
                    setTimeout(() => setSelectedUserDetails(null), 300);
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {loadingDetails || !selectedUserDetails ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-400">Loading profile...</p>
                  </div>
                ) : (
                  <div className="space-y-6 mt-2">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {selectedUserDetails.user.name}
                      </h2>
                      <p className="text-slate-400 mb-2">
                        {selectedUserDetails.user.email} -{' '}
                        <span className="font-semibold text-primary-400">
                          {selectedUserDetails.user.role}
                        </span>
                      </p>

                      {selectedUserDetails.user.role === 'STAFF' && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-4 flex items-end gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                              Update Manager
                            </label>
                            <select
                              value={
                                newManagerId ||
                                selectedUserDetails.user.managerId ||
                                ''
                              }
                              onChange={(e) => setNewManagerId(e.target.value)}
                              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm transition-all duration-200"
                            >
                              <option value="" className="bg-slate-900">
                                No Manager
                              </option>
                              {users
                                .filter((u) => u.role === 'MANAGER')
                                .map((manager) => (
                                  <option
                                    key={manager.id}
                                    value={manager.id}
                                    className="bg-slate-900"
                                  >
                                    {manager.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <Button
                            onClick={handleUpdateManager}
                            disabled={
                              !newManagerId ||
                              newManagerId ===
                                selectedUserDetails.user.managerId
                            }
                            isLoading={updatingManager}
                          >
                            Update
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-primary-400" />
                        <div className="text-xl font-bold text-white">
                          {selectedUserDetails.stats.totalWorkingHours}h
                        </div>
                        <div className="text-xs text-slate-400">
                          Total Hours
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                        <Calendar className="w-6 h-6 mx-auto mb-2 text-green-400" />
                        <div className="text-xl font-bold text-white">
                          {selectedUserDetails.stats.daysPresent}
                        </div>
                        <div className="text-xs text-slate-400">
                          Days Present
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                        <Activity className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                        <div className="text-xl font-bold text-white">
                          {selectedUserDetails.stats.totalOvertimeHours}h
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
                            </tr>
                          </thead>
                          <tbody>
                            {selectedUserDetails.attendance.map(
                              (record: any) => (
                                <tr
                                  key={record.id}
                                  className="border-b border-white/5 last:border-0"
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
                                    {record.checkOut
                                      ? new Date(
                                          record.checkOut
                                        ).toLocaleTimeString()
                                      : '-'}
                                  </td>
                                </tr>
                              )
                            )}
                            {selectedUserDetails.attendance.length === 0 && (
                              <tr>
                                <td
                                  colSpan={3}
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
