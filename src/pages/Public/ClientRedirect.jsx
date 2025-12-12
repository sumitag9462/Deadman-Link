// src/pages/Public/ClientRedirect.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

/**
 * ClientRedirect
 *
 * Behavior:
 * - Looks for a local mapping in localStorage under key "deadman_preview_map".
 * - If found, redirect to the mapped target.
 * - Otherwise fallback to a fixed default target (set in FIXED_TARGET).
 *
 * This runs entirely in the browser — no backend calls.
 */
export default function ClientRedirect() {
  const { slug } = useParams();

  // CHANGE this to the pre-decided fallback target you want:
  const FIXED_TARGET = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

  useEffect(() => {
    // try to read mapping
    try {
      const raw = localStorage.getItem('deadman_preview_map') || '{}';
      const map = JSON.parse(raw || '{}');

      const target = map?.[slug] || FIXED_TARGET;

      // Replace current location with target (no history entry)
      window.location.replace(target);
    } catch (err) {
      // If localStorage parsing fails — fallback to fixed target
      console.error('ClientRedirect error:', err);
      window.location.replace(FIXED_TARGET);
    }
  }, [slug]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
      <div className="text-center">
        <div className="mb-4">Redirecting...</div>
        <div className="text-xs">If redirect doesn't happen automatically, <a href="#" onClick={(e)=>{e.preventDefault(); window.location.reload();}} className="text-emerald-400">reload</a>.</div>
      </div>
    </div>
  );
}
