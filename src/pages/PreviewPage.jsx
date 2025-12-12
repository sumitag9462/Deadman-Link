// src/pages/PreviewPage.jsx
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link as LinkIcon } from 'lucide-react';

export default function PreviewPage() {
  const { slug } = useParams();
  const location = useLocation();

  // For a demo preview we can include the fixed URL and some static info.
  // Optionally the LandingPage could include encoded info in query params if needed.
  const demoTarget = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-2xl p-8 bg-slate-900/60 border-slate-800">
        <h2 className="text-2xl font-semibold text-white mb-3">Preview — {slug}</h2>
        <p className="text-slate-400 mb-4">
          This is a local preview only. No data has been sent to the server.
        </p>

        <div className="bg-slate-950 p-4 rounded mb-4">
          <div className="text-xs text-slate-400">Destination</div>
          <div className="text-slate-200">{demoTarget}</div>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => window.open(demoTarget, '_blank')} className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> Open Destination
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Back to home
          </Button>
        </div>
      </Card>
    </div>
  );
}
