// File: src/config/appUrl.js

// Optional: set in .env (see below)
const DEV_LAN_IP = import.meta.env.VITE_DEV_LAN_IP;
const EXPLICIT_APP_URL = import.meta.env.VITE_APP_URL;

let base = '';

if (EXPLICIT_APP_URL) {
  // If you provide a full URL in env, always use that
  base = EXPLICIT_APP_URL;
} else if (typeof window !== 'undefined') {
  const current = window.location.origin;
  const url = new URL(current);

  // If you're running on localhost but you've told us your LAN IP,
  // swap localhost -> 192.168.x.x:port so QR works on phone.
  if (
    DEV_LAN_IP &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  ) {
    base = `${url.protocol}//${DEV_LAN_IP}${url.port ? ':' + url.port : ''}`;
  } else {
    base = current;
  }
} else {
  base = '';
}

// strip trailing slashes
export const APP_BASE_URL = base.replace(/\/+$/, '');

// (optional) debug: see what URL is actually being used
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[Deadman-Link] APP_BASE_URL =', APP_BASE_URL);
}
