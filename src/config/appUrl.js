// src/config/appUrl.js
// Computes the base URL used in short links / QR codes

const DEV_LAN_IP = import.meta.env.VITE_DEV_LAN_IP;
let APP_BASE_URL = import.meta.env.VITE_APP_URL;

// If VITE_APP_URL is not set, fall back smartly
if (!APP_BASE_URL) {
  if (DEV_LAN_IP) {
    // dev LAN mode
    APP_BASE_URL = `http://${DEV_LAN_IP}:5173`;
  } else {
    // default to current origin (localhost:5173 in dev, real domain in prod)
    APP_BASE_URL = window.location.origin;
  }
}

export { APP_BASE_URL };
