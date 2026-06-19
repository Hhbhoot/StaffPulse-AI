import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  Calendar,
  Clock,
  Users,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Sparkles,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const navItems = {
    STAFF: [
      { path: '/staff', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/staff/history', icon: Clock, label: 'Attendance History' },
      {
        path: '/staff/ai-assistant',
        icon: MessageSquare,
        label: 'AI Policy Assistant',
      },
      { path: '/staff/profile', icon: Settings, label: 'Profile' },
    ],
    MANAGER: [
      { path: '/manager', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/manager/staff', icon: Users, label: 'Staff' },
      { path: '/manager/attendance', icon: Clock, label: 'Attendance' },
      { path: '/manager/reports', icon: Sparkles, label: 'AI Reports' },
      { path: '/manager/ai-search', icon: MessageSquare, label: 'AI Search' },
      { path: '/manager/ai-data', icon: Sparkles, label: 'AI Data Assistant' },
    ],
    ADMIN: [
      { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/users', icon: Users, label: 'Users' },
      { path: '/admin/attendance', icon: Clock, label: 'Attendance' },
      {
        path: '/admin/ai-assistant',
        icon: MessageSquare,
        label: 'AI Assistant',
      },
      { path: '/admin/ai-data', icon: Sparkles, label: 'AI Data Assistant' },
      {
        path: '/admin/knowledge-base',
        icon: FileText,
        label: 'Knowledge Base',
      },
      { path: '/admin/reports', icon: Sparkles, label: 'Reports' },
      { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  };

  const links = navItems[user.role] || [];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-white/10 z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
            Devsto
          </h2>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2 focus:outline-none"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:relative top-0 left-0 h-full w-64 flex-shrink-0 glass-panel border-r border-white/10 flex flex-col z-40 transition-transform duration-300 ease-in-out md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
            Attendance Sys
          </h2>
          <div className="mt-2 text-xs text-slate-400 uppercase tracking-wider font-semibold">
            {user.role} PORTAL
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={cn(
                  'relative flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 group',
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary-500/20 border border-primary-500/30 rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <Icon className="w-5 h-5 mr-3 relative z-10" />
                <span className="relative z-10">{link.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 relative z-10">
          <div className="mb-4 px-2">
            <div className="text-sm font-medium text-white truncate">
              {user.name}
            </div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

        <div className="p-6 md:p-8 lg:p-10 relative z-10 max-w-7xl mx-auto min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
