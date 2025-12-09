// src/hooks/useUserActivity.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const useUserActivity = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    // Connect to Socket.IO
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🟢 Connected to activity tracker');
      
      // Notify server user is online
      socket.emit('user-connected', {
        userId: user.id,
        userName: user.name,
      });
    });

    // Send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('user-heartbeat', { userId: user.id });
      }
    }, HEARTBEAT_INTERVAL);

    // Track user activity on mouse/keyboard events
    const handleActivity = () => {
      if (socket.connected) {
        socket.emit('user-activity', { userId: user.id });
      }
    };

    // Throttle activity events to avoid spamming
    let lastActivity = 0;
    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 10000) { // Max once per 10 seconds
        lastActivity = now;
        handleActivity();
      }
    };

    // Listen to user interactions
    window.addEventListener('mousemove', throttledActivity);
    window.addEventListener('keydown', throttledActivity);
    window.addEventListener('click', throttledActivity);
    window.addEventListener('scroll', throttledActivity);

    // Cleanup
    return () => {
      clearInterval(heartbeatIntervalRef.current);
      window.removeEventListener('mousemove', throttledActivity);
      window.removeEventListener('keydown', throttledActivity);
      window.removeEventListener('click', throttledActivity);
      window.removeEventListener('scroll', throttledActivity);
      
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  return null;
};
