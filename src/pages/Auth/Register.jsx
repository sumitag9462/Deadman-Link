import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Shield, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('form'); // 'form' or 'verify'
  const [otp, setOtp] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // API Config
  const envApi = import.meta.env.VITE_API_URL;
  const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:4000/api'
    : (envApi || 'http://localhost:4000/api');

  // 1. Send OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step A: Send OTP with explicit 'signup' purpose
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email.toLowerCase().trim(), 
          purpose: 'signup' // <--- CRITICAL
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to send OTP');

      toast.success('OTP sent to your email');
      setStage('verify');
    } catch (err) {
      console.error('send-otp error', err);
      toast.error(err.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP & Register User
  const handleVerify = async () => {
    setLoading(true);
    try {
      // Step B: Verify OTP (Must match purpose 'signup')
      const verifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email.toLowerCase().trim(), 
          code: otp.trim(), 
          purpose: 'signup' // <--- CRITICAL
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData?.verified) {
        throw new Error(verifyData?.message || 'Invalid OTP');
      }

      // Step C: Actually Create User in Database
      const registerRes = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email.toLowerCase().trim(),
          password: formData.password
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(registerData.message || 'Registration failed');
      }

      // Success! Login the user
      login({
        ...registerData.user,
        token: registerData.token,
      });

      toast.success('Agent registered successfully!');
      navigate('/dashboard');

    } catch (err) {
      console.error('Registration error', err);
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email.toLowerCase().trim(), 
          purpose: 'signup' 
        }),
      });
      if (!res.ok) throw new Error('Failed to resend');
      toast.success('OTP resent');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md p-8 border-slate-800 bg-slate-900">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">New Operative</h1>
          <p className="text-slate-400 text-sm mt-2">Create a secure identity.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Codename (Name)"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={stage === 'verify'}
            icon={<User className="w-4 h-4" />}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="agent@deadman.link"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={stage === 'verify'}
            icon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={stage === 'verify'}
          />

          {stage === 'form' && (
            <Button type="submit" isLoading={loading}>Create Account</Button>
          )}

          {stage === 'verify' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-3 bg-slate-800/50 rounded-md border border-slate-700 mb-4">
                <p className="text-xs text-slate-400 text-center">
                  Sent to <span className="text-emerald-400">{formData.email}</span>
                </p>
              </div>
              <Input
                label="Verification Code"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoFocus
              />
              <div className="flex items-center gap-2 pt-2">
                <Button type="button" isLoading={loading} onClick={handleVerify} className="flex-1">Verify & Continue</Button>
                <Button type="button" onClick={handleResend} variant="ghost" disabled={loading}>Resend</Button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already active? <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-medium">Login here</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;