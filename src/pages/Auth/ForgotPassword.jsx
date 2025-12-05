import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Reset link sent to your comms channel.");
      setLoading(false);
    }, 1500);
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
           <p className="text-slate-400 text-sm mt-2">Enter your email to recover access.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Email Address" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" isLoading={loading}>Send Reset Link</Button>
        </form>
      </Card>
    </div>
  );
};
export default ForgotPassword;