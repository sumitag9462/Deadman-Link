import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [stage, setStage] = useState(1); // 1: Email, 2: OTP, 3: New Pass
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null); // Proof of verification

  const navigate = useNavigate();
  
  const envApi = import.meta.env.VITE_API_URL;
  const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:4000/api'
    : (envApi || 'http://localhost:4000/api');

  // STAGE 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: email.toLowerCase().trim(), 
            purpose: 'forgot' 
        }),
      });
      if (!res.ok) throw new Error('Failed to send OTP');
      
      toast.success('Code sent to your email.');
      setStage(2);
    } catch (err) {
      toast.error(err.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  // STAGE 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: email.toLowerCase().trim(), 
            code: otp.trim(), 
            purpose: 'forgot' 
        }),
      });
      
      const data = await res.json();
      if (!res.ok || !data.verified) throw new Error(data.message || 'Invalid code');

      setResetToken(data.token); // Save this token for the next step!
      toast.success('Code verified.');
      setStage(3);
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // STAGE 3: Reset Password
  const handleReset = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          newPassword: passwords.new,
          token: resetToken // Send the proof
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password');

      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md p-8 border-slate-800 bg-slate-900">
        <div className="mb-6">
          <Link to="/login" className="text-slate-500 hover:text-white flex items-center text-sm mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
          </Link>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Credentials</h1>
          <p className="text-slate-400 text-sm mt-2">
            {stage === 1 && "Enter your email to recover access."}
            {stage === 2 && "Enter the verification code."}
            {stage === 3 && "Create a new strong password."}
          </p>
        </div>

        {/* --- FORM STAGES --- */}
        {stage === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="agent@deadman.link"
            />
            <Button type="submit" isLoading={loading}>Send Reset Link</Button>
          </form>
        )}

        {stage === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
            <div className="p-2 bg-slate-800 rounded text-center text-sm text-slate-300">
              Code sent to <span className="text-emerald-400">{email}</span>
            </div>
            <Input
              label="Verification Code"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="123456"
              autoFocus
            />
            <Button type="submit" isLoading={loading}>Verify Code</Button>
            <div className="text-center">
                 <button type="button" onClick={() => setStage(1)} className="text-xs text-slate-500 underline">Change Email</button>
            </div>
          </form>
        )}

        {stage === 3 && (
          <form onSubmit={handleReset} className="space-y-4 animate-in fade-in">
            <Input
              label="New Password"
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              required
              placeholder="••••••••"
            />
            <Input
              label="Confirm Password"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              required
              placeholder="••••••••"
            />
            <Button type="submit" isLoading={loading}>Update Password</Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;