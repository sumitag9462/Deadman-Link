import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ShieldAlert, Lock, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const RedirectHandler = () => {
  const { slug } = useParams();
  const [status, setStatus] = useState('analyzing'); // analyzing, password, preview, error, redirecting
  const [passwordInput, setPasswordInput] = useState('');
  
  // Mock Data to simulate different link types for your Demo
  const mockLinkData = {
    'secure': { type: 'password', target: 'https://google.com' },
    'preview': { type: 'preview', target: 'https://github.com' },
    'expired': { type: 'error', error: 'Link has self-destructed.' },
    'burn': { type: 'burn', target: 'https://secret.com' } // Simulate one-time view
  };

  useEffect(() => {
    // Simulate Server Lookup
    setTimeout(() => {
      const data = mockLinkData[slug];

      if (!data) {
        // Default behavior for unknown links (Simulate standard redirect)
        window.location.href = 'https://google.com';
        return;
      }

      if (data.type === 'error') {
        setStatus('error');
      } else if (data.type === 'password') {
        setStatus('password');
      } else if (data.type === 'preview') {
        setStatus('preview');
      } else {
        // Direct redirect
        window.location.href = data.target;
      }
    }, 1500);
  }, [slug]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passwordInput === '1234') { // Mock Password
        setStatus('redirecting');
        setTimeout(() => window.location.href = 'https://google.com', 1000);
    } else {
        alert("Decryption Failed: Invalid Credentials");
    }
  };

  const handleProceed = () => {
    setStatus('redirecting');
    setTimeout(() => window.location.href = 'https://github.com', 800);
  };

  // --- RENDER STATES ---

  if (status === 'analyzing' || status === 'redirecting') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-sm animate-pulse">
            {status === 'analyzing' ? 'Establishing Secure Handshake...' : 'Decryption Complete. Redirecting...'}
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-red-500/20 bg-slate-900">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Connection Terminated</h1>
          <p className="text-slate-400">
            This Deadman link has expired or self-destructed.
          </p>
        </Card>
      </div>
    );
  }

  if (status === 'password') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 border-slate-800 bg-slate-900">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Encrypted Payload</h2>
            <p className="text-slate-400 text-sm mt-1">Enter access code to decrypt destination.</p>
          </div>
          <form onSubmit={handleUnlock}>
            <Input 
              type="password" 
              placeholder="Enter Password..." 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="text-center tracking-widest font-mono"
              autoFocus
            />
            <Button className="mt-4">Decrypt & Access</Button>
          </form>
        </Card>
      </div>
    );
  }

  if (status === 'preview') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 border-slate-800 bg-slate-900">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Safety Preview</h2>
            <p className="text-slate-400 text-sm mt-2">
                You are leaving Deadman Link and visiting:
            </p>
            <div className="my-4 p-3 bg-slate-950 border border-slate-800 rounded text-emerald-400 font-mono text-sm truncate">
                https://github.com/project-files
            </div>
          </div>
          <div className="space-y-3">
            <Button onClick={handleProceed}>Proceed to Destination</Button>
            <Button variant="secondary" onClick={() => window.close()}>Cancel</Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default RedirectHandler;