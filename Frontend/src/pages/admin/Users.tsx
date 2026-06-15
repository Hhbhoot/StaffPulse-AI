import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../api';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
                <th className="px-4 py-4 rounded-tr-xl">Joined</th>
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
    </div>
  );
}
