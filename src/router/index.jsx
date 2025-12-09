// File: src/router/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Auth Pages
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';

// Public Pages
import LandingPage from '../pages/LandingPage';
import RedirectHandler from '../pages/Public/RedirectHandler';
import NotFound from '../pages/NotFound';
import WatchRoom from '../pages/Public/WatchRoom'; // ✅ NEW

// User Dashboard
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome from '../pages/Dashboard/Home';
import MyLinks from '../pages/Dashboard/MyLinks';
import Analytics from '../pages/Dashboard/Analytics';
import Settings from '../pages/Dashboard/Settings';
import WatchParty from '../pages/Dashboard/WatchParty'; // ✅ NEW

// Admin Dashboard
import AdminLayout from '../components/layout/AdminLayout';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import LinkManagement from '../pages/Admin/LinkManagement';
import UserControls from '../pages/Admin/UserControls';
import AuditLogs from '../pages/Admin/AuditLogs';
import SystemSettings from '../pages/Admin/SystemSettings';

// Guards
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* User Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="links" element={<MyLinks />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        {/* ✅ new watch party creator */}
        <Route path="watch" element={<WatchParty />} />
      </Route>

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="links" element={<LinkManagement />} />
        <Route path="users" element={<UserControls />} />
        <Route path="logs" element={<AuditLogs />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      {/* Public watch room */}
      <Route path="/watch/:roomCode" element={<WatchRoom />} />

      <Route path="/:slug" element={<RedirectHandler />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
