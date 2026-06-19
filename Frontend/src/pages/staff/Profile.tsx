import React, { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Upload, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export function StaffProfile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data: any = {};
      if (name !== user?.name) data.name = name;
      if (password) data.password = password;

      if (Object.keys(data).length === 0) {
        setLoading(false);
        return;
      }

      const res = await api.put('/auth/profile', data);
      updateUser(res.data.user);
      toast.success('Profile updated successfully');
      setPassword(''); // Clear password field
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarLoading(true);
    try {
      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.user);
      toast.success('Profile picture updated successfully');
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || 'Failed to upload profile picture'
      );
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
      <p className="text-slate-400 text-lg">Update your personal information</p>

      <GlassCard>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        {success && <div className="text-green-400 mb-4">{success}</div>}

        <div className="mb-6 pb-6 border-b border-white/10 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 flex items-center justify-center relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-10 h-10 text-slate-400" />
              )}
              {avatarLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors group-hover:scale-110">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarLoading}
              />
            </label>
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">
              Account Details
            </h2>
            <p className="text-sm text-slate-400">
              Your email address and role cannot be changed.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Email Address</p>
                <p className="font-medium text-slate-200">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">System Role</p>
                <p className="font-medium text-slate-200">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
          />
          <div className="pt-4">
            <Button
              type="submit"
              isLoading={loading}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
