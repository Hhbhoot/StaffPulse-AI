import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';

// Staff Pages
import { StaffDashboard } from './pages/staff/Dashboard';
import { StaffAttendanceHistory } from './pages/staff/AttendanceHistory';
import { StaffAIAssistant } from './pages/staff/AIAssistant';
import { StaffProfile } from './pages/staff/Profile';
import { StaffLeaves } from './pages/staff/Leaves';

// Manager Pages
import { ManagerDashboard } from './pages/manager/Dashboard';
import { ManagerStaff } from './pages/manager/Staff';
import { ManagerAttendance } from './pages/manager/Attendance';
import { ManagerReports } from './pages/manager/Reports';
import { ManagerAISearch } from './pages/manager/AISearch';
import { ManagerLeaves } from './pages/manager/Leaves';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminAttendance } from './pages/admin/Attendance';
import { AdminUsers } from './pages/admin/Users';
import { AdminLeaves } from './pages/admin/Leaves';
import { AdminKnowledgeBase } from './pages/admin/KnowledgeBase';
import { AdminAIAssistant } from './pages/admin/AIAssistant';
import { AdminReports } from './pages/admin/Reports';
import { AdminSettings } from './pages/admin/Settings';
import { AIDataAssistant } from './pages/admin/AIDataAssistant';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="/login" />} />

              {/* Staff Routes */}
              <Route
                path="staff"
                element={<ProtectedRoute allowedRoles={['STAFF']} />}
              >
                <Route index element={<StaffDashboard />} />
                <Route path="history" element={<StaffAttendanceHistory />} />
                <Route path="ai-assistant" element={<StaffAIAssistant />} />
                <Route path="profile" element={<StaffProfile />} />
                <Route path="leaves" element={<StaffLeaves />} />
              </Route>

              {/* Manager Routes */}
              <Route
                path="manager"
                element={<ProtectedRoute allowedRoles={['MANAGER']} />}
              >
                <Route index element={<ManagerDashboard />} />
                <Route path="staff" element={<ManagerStaff />} />
                <Route path="attendance" element={<ManagerAttendance />} />
                <Route path="reports" element={<ManagerReports />} />
                <Route path="ai-search" element={<ManagerAISearch />} />
                <Route path="ai-data" element={<AIDataAssistant />} />
                {/* Legacy routes */}
                <Route path="team" element={<ManagerStaff />} />
                <Route path="leaves" element={<ManagerLeaves />} />
                <Route path="profile" element={<StaffProfile />} />
              </Route>

              {/* Admin Routes */}
              <Route
                path="admin"
                element={<ProtectedRoute allowedRoles={['ADMIN']} />}
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="attendance" element={<AdminAttendance />} />
                <Route path="ai-assistant" element={<AdminAIAssistant />} />
                <Route path="ai-data" element={<AIDataAssistant />} />
                <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="profile" element={<StaffProfile />} />
                {/* Legacy route kept just in case */}
                <Route path="leaves" element={<AdminLeaves />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
