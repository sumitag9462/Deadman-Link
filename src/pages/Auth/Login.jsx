import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Helper for API URL
  const envApi = import.meta.env.VITE_API_URL;
  const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:4000/api'
    : (envApi || 'http://localhost:4000/api');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Success! Login via Context
      login({
        ...data.user,
        token: data.token
      });

      toast.success('Access Granted');
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${isAdminMode ? 'from-red-600 to-orange-600' : 'from-emerald-600 to-cyan-600'}`}></div>

      <Card className="w-full max-w-md p-8 border-slate-800 bg-slate-900 z-10">
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 transition-colors ${isAdminMode ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}
          >
            {isAdminMode ? <ShieldAlert className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </button>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isAdminMode ? 'Command Override' : 'Access Terminal'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {isAdminMode ? 'Restricted to Level 5 Personnel.' : 'Enter your credentials to continue.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder={isAdminMode ? "admin@sys.gov" : "agent@deadman.link"}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            icon={<Mail className="w-4 h-4" />}
            required
          />
          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            {!isAdminMode && (
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-emerald-500 hover:text-emerald-400">
                  Forgot password?
                </Link>
              </div>
            )}
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className={isAdminMode ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : ''}
          >
            {isAdminMode ? 'Authorize Admin Session' : 'Authenticate'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4 text-sm text-slate-500">
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            className="text-xs uppercase tracking-widest hover:text-white transition-colors border-b border-dashed border-slate-700 pb-0.5"
          >
            Switch to {isAdminMode ? 'Agent' : 'Admin'} Login
          </button>

          {!isAdminMode && (
            <div className="text-center pt-2 border-t border-slate-800 w-full">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-500 hover:text-emerald-400 font-medium">
                Initialize Protocol
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Login;