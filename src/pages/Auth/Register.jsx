import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { UserPlus, Shield, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); // We'll just log them in directly after register
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      // 1. UPDATE GLOBAL STATE
      login({ 
        _id: 'user_new',
        name: formData.name,
        email: formData.email,
        role: 'user'
      });

      toast.success("Identity established.");
      setLoading(false);
      
      // 2. NAVIGATE
      navigate('/dashboard');
    }, 1000);
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
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            icon={<User className="w-4 h-4" />}
          />

          <Input 
            label="Email Address" 
            type="email" 
            placeholder="agent@deadman.link"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            icon={<Mail className="w-4 h-4" />}
          />
          
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />

          <Button type="submit" isLoading={loading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already active?{' '}
          <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-medium">
            Login here
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;