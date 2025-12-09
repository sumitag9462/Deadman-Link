// server/index.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const watchRoutes = require('./routes/watchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const Link = require('./models/Link');
const User = require('./models/User');
const AnalyticsEvent = require('./models/AnalyticsEvent');
const adminRoutes = require('./routes/adminRoutes');
const adminLinkRoutes = require('./routes/adminLinkRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const { router: authRoutes, authenticate } = require('./routes/authRoutes');

// Rate limiting and security middleware
const { generalLimiter, authLimiter, linkCreationLimiter, redirectLimiter } = require('./middleware/rateLimiter');
const { ipBlocker } = require('./middleware/ipBlocker');

const app = express();
// Default to a less common port to reduce local collisions
const PORT = process.env.PORT || 5050;

const passport = require('passport');
require('./config/passport');

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(passport.initialize());

// Apply IP blocking globally (first line of defense)
app.use(ipBlocker);

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// ---- Auth routes with stricter rate limiting ----
app.use('/api/auth', authLimiter, authRoutes);

// ---- MongoDB connection ----
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/deadman_link';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ---------------- REST ROUTES ---------------- //

// health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// watch party REST routes (protected)
app.use('/api/watch', authenticate, watchRoutes);

// analytics REST routes (REAL data) - protected
app.use('/api/analytics', authenticate, analyticsRoutes);

// Admin middleware - must be logged in AND be admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// admin link management routes (more specific -> mount first)
app.use('/api/admin/links', authenticate, requireAdmin, adminLinkRoutes);

// other admin routes
app.use('/api/admin', authenticate, requireAdmin, adminRoutes);

// admin user access controls
app.use('/api/admin/users', authenticate, requireAdmin, adminUserRoutes);

// moderation routes (reports can be public, review is admin-only)
app.use('/api/moderation', moderationRoutes);

// GET /api/links/public - fetch all public/active links (for community browsing)
app.get('/api/links/public', authenticate, async (req, res) => {
  try {
    const links = await Link.find({})
    .sort({ createdAt: -1 })
    .limit(500) // Limit to prevent overwhelming the client
    .select('_id slug targetUrl title clicks createdAt ownerEmail password showPreview isOneTime maxClicks collection status');

    console.log(`📊 Fetched ${links.length} public links`);
    res.json(links);
  } catch (err) {
    console.error('Error fetching public links:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/links - list links created by authenticated user only (protected)
app.get('/api/links', authenticate, async (req, res) => {
  try {
    // Filter by user's email - simple and works with existing data
    const query = { ownerEmail: req.user.email };

    const links = await Link.find(query).sort({ createdAt: -1 });
    res.json(links);
  } catch (err) {
    console.error('Error fetching links:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// GET /api/links/:slug - fetch a single link with rule checks
app.get('/api/links/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const link = await Link.findOne({ slug });
    if (!link) {
      return res.status(404).json({ status: 'not_found' });
    }

    const now = new Date();

    // EXPIRY CHECK
    if (link.expiresAt && now > link.expiresAt) {
      if (link.status !== 'expired') {
        link.status = 'expired';
        await link.save();
      }
      return res.status(200).json({
        status: 'expired',
        reason: 'Link has self-destructed.',
      });
    }

    // CLICK LIMIT CHECK
    const effectiveLimit = link.isOneTime ? 1 : link.maxClicks || 0;
    if (effectiveLimit > 0 && link.clicks >= effectiveLimit) {
      if (link.status !== 'expired') {
        link.status = 'expired';
        await link.save();
      }
      return res.status(200).json({
        status: 'expired',
        reason: 'Link has reached its maximum allowed clicks.',
      });
    }

    // Scheduled activation
    if (link.scheduleStart && now < link.scheduleStart) {
      return res.status(200).json({
        status: 'scheduled',
        reason: 'Link is not active yet.',
        startsAt: link.scheduleStart,
      });
    }

    return res.status(200).json({
      status: 'active',
      link,
    });
  } catch (err) {
    console.error('Error in GET /api/links/:slug:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/links - create a new short link (protected + rate limited)
app.post('/api/links', authenticate, linkCreationLimiter, async (req, res) => {
  try {
    const {
      url,
      slug,
      title,
      password,
      isOneTime,
      maxClicks,
      expiresAt,
      showPreview,
      collection,
      scheduleStart,
      creatorName,
       ownerEmail,
    } = req.body || {};

    if (!url) {
      return res.status(400).json({ message: 'url is required' });
    }

    // slug handling
    let finalSlug;
    if (slug && slug.trim()) {
      const normalizedSlug = slug.trim();
      const alreadyExists = await Link.findOne({ slug: normalizedSlug });
      if (alreadyExists) {
        return res.status(409).json({ message: 'Slug already taken' });
      }
      finalSlug = normalizedSlug;
    } else {
      finalSlug = Math.random().toString(36).substring(2, 8);
      let exists = await Link.findOne({ slug: finalSlug });
      while (exists) {
        finalSlug = Math.random().toString(36).substring(2, 8);
        exists = await Link.findOne({ slug: finalSlug });
      }
    }

    const now = new Date();

    const newLink = await Link.create({
      title: title || url,
      slug: finalSlug,
      targetUrl: url,
      clicks: 0,
      status: 'active',
      createdAt: now,

      password: password || null,
      isOneTime: !!isOneTime,
      maxClicks: maxClicks || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      showPreview: !!showPreview,
      collection: collection || 'General',
      scheduleStart: scheduleStart ? new Date(scheduleStart) : null,
      creatorName: creatorName || 'Anonymous',
      ownerEmail: ownerEmail || null,
      isFavorite: false,
    });

    return res.status(201).json(newLink);
  } catch (err) {
    console.error('Error in POST /api/links:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/links/:id - update link details (protected)
app.put('/api/links/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      targetUrl,
      password,
      isOneTime,
      maxClicks,
      expiresAt,
      showPreview,
      collection,
      creatorName,
    } = req.body || {};

    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Check ownership by email
    if (link.ownerEmail !== req.user.email) {
      return res.status(403).json({ message: 'You do not have permission to edit this link' });
    }

    // Update allowed fields
    if (title !== undefined) link.title = title;
    if (targetUrl !== undefined) link.targetUrl = targetUrl;
    if (password !== undefined) link.password = password || null;
    if (isOneTime !== undefined) link.isOneTime = !!isOneTime;
    if (maxClicks !== undefined) link.maxClicks = maxClicks;
    if (expiresAt !== undefined)
      link.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (showPreview !== undefined) link.showPreview = !!showPreview;
    if (collection !== undefined) link.collection = collection;
    if (creatorName !== undefined) link.creatorName = creatorName;

    const updated = await link.save();
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error in PUT /api/links/:id:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/links/:id/favorite - toggle favorite status (protected)
app.patch('/api/links/:id/favorite', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Check ownership by email
    if (link.ownerEmail !== req.user.email) {
      return res.status(403).json({ message: 'You do not have permission to modify this link' });
    }

    link.isFavorite = !link.isFavorite;
    const updated = await link.save();
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error in PATCH /api/links/:id/favorite:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/links/:id - delete a link (protected)
app.delete('/api/links/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Check ownership by email
    if (link.ownerEmail !== req.user.email) {
      return res.status(403).json({ message: 'You do not have permission to delete this link' });
    }

    await Link.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ message: 'Link deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /api/links/:id:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ---- helper to guess device from UA for analytics ----
function getDeviceType(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/mobile/.test(ua)) return 'mobile';
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/bot|crawler|spider/.test(ua)) return 'bot';
  return 'desktop';
}

// REAL REDIRECT ENDPOINT + analytics logging (rate limited to prevent bot abuse)
app.get('/r/:slug', redirectLimiter, async (req, res) => {
  try {
    const { slug } = req.params;
    const link = await Link.findOne({ slug });

    if (!link) {
      return res.status(404).send('Deadman-Link: Not found');
    }

    const now = new Date();

    // expiry check
    if (link.expiresAt && now > link.expiresAt) {
      if (link.status !== 'expired') {
        link.status = 'expired';
        await link.save();
      }
      return res
        .status(410)
        .send('Deadman-Link: This link has self-destructed (expired).');
    }

    // schedule check
    if (link.scheduleStart && now < link.scheduleStart) {
      return res
        .status(403)
        .send('Deadman-Link: This link is not active yet.');
    }

    // click limit check
    const effectiveLimit = link.isOneTime ? 1 : link.maxClicks || 0;
    if (effectiveLimit > 0 && link.clicks >= effectiveLimit) {
      if (link.status !== 'expired') {
        link.status = 'expired';
        await link.save();
      }
      return res
        .status(410)
        .send(
          'Deadman-Link: This link has reached its maximum allowed clicks.'
        );
    }

    // increment clicks + possibly expire
    link.clicks += 1;
    if (effectiveLimit > 0 && link.clicks >= effectiveLimit) {
      link.status = 'expired';
    }
    await link.save();

    // ---- log analytics event (non-blocking) ----
    const ipRaw =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ip = Array.isArray(ipRaw)
      ? ipRaw[0]
      : ipRaw.split(',')[0].trim();

    const userAgent = req.headers['user-agent'] || '';
    const deviceType = getDeviceType(userAgent);

    // Try to get country from headers first (Cloudflare, etc.)
    let country = req.headers['cf-ipcountry'] || req.headers['x-country'];

    // If not available, use IP geolocation API for local/testing
    if (!country && ip && ip !== '::1' && ip !== '127.0.0.1') {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=country`);
        const geoData = await geoResponse.json();
        country = geoData.country || 'Unknown';
      } catch (geoErr) {
        console.log('Geolocation lookup failed:', geoErr.message);
        country = 'Unknown';
      }
    } else if (!country) {
      country = 'Local';
    }

    try {
      await AnalyticsEvent.create({
        link: link._id,
        slug: link.slug,
        ip,
        userAgent,
        deviceType,
        country,
      });
    } catch (logErr) {
      console.error('Failed to log analytics event:', logErr.message);
      // do NOT block redirect
    }

    return res.redirect(link.targetUrl);
  } catch (err) {
    console.error('Error in GET /r/:slug:', err);
    res.status(500).send('Deadman-Link: Internal server error.');
  }
});

// ---------------- SOCKET.IO ---------------- //

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// expose io to all routes via req.app.get('io')
app.set('io', io);


// Track user activity
const activeUsers = new Map(); // userId -> { socketId, lastActivity }

// Check for idle/offline users every 30 seconds
setInterval(async () => {
  const now = Date.now();
  const IDLE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
  const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  for (const [userId, data] of activeUsers.entries()) {
    const timeSinceActivity = now - data.lastActivity;

    try {
      if (timeSinceActivity > OFFLINE_THRESHOLD) {
        // User is offline
        await User.findByIdAndUpdate(userId, { onlineStatus: 'offline' });
        activeUsers.delete(userId);
        console.log('⚫ User went offline:', userId);
      } else if (timeSinceActivity > IDLE_THRESHOLD) {
        // User is idle
        const user = await User.findById(userId);
        if (user && user.onlineStatus !== 'idle') {
          await User.findByIdAndUpdate(userId, { onlineStatus: 'idle' });
          console.log('🟡 User went idle:', userId);
        }
      }
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  }
}, 30000);

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // User authentication and status tracking
  socket.on('user-connected', async ({ userId, userName }) => {
    if (!userId) return;
    
    socket.data.userId = userId;
    socket.data.userName = userName;
    activeUsers.set(userId, { socketId: socket.id, lastActivity: Date.now() });

    try {
      await User.findByIdAndUpdate(userId, {
        onlineStatus: 'online',
        lastActiveAt: new Date(),
      });
      console.log('🟢 User online:', userId, userName);
      
      // Notify admins about user status change
      io.emit('admin:user-updated', await User.findById(userId).select('-password'));
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  });

  // Heartbeat to keep user active
  socket.on('user-heartbeat', async ({ userId }) => {
    if (!userId) return;
    
    const userData = activeUsers.get(userId);
    if (userData) {
      userData.lastActivity = Date.now();
      activeUsers.set(userId, userData);
    }

    try {
      // Update to online if they were idle
      const user = await User.findById(userId);
      if (user && user.onlineStatus !== 'online') {
        await User.findByIdAndUpdate(userId, {
          onlineStatus: 'online',
          lastActiveAt: new Date(),
        });
        io.emit('admin:user-updated', await User.findById(userId).select('-password'));
      }
    } catch (err) {
      console.error('Error processing heartbeat:', err);
    }
  });

  // User activity (any interaction)
  socket.on('user-activity', async ({ userId }) => {
    if (!userId) return;

    const userData = activeUsers.get(userId);
    if (userData) {
      userData.lastActivity = Date.now();
      activeUsers.set(userId, userData);
    }

    try {
      await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
    } catch (err) {
      console.error('Error updating last active:', err);
    }
  });

  socket.on('join-room', ({ roomCode, userName }) => {
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.userName = userName || 'Guest';

    socket.to(roomCode).emit('user-joined', {
      userName: socket.data.userName,
    });
  });

  socket.on('player-action', (payload) => {
    const { roomCode } = payload;
    if (!roomCode) return;
    socket.to(roomCode).emit('player-action', payload);
  });

  socket.on('chat-message', ({ roomCode, userName, message }) => {
    if (!roomCode || !message?.trim()) return;

    io.to(roomCode).emit('chat-message', {
      userName: userName || socket.data.userName || 'Guest',
      message,
      ts: Date.now(),
    });
  });

  socket.on('disconnect', async () => {
    console.log('🔌 Client disconnected:', socket.id);
    
    const userId = socket.data.userId;
    if (userId) {
      // Don't immediately set to offline - let the interval handle it
      // This allows for reconnections without status flicker
      const userData = activeUsers.get(userId);
      if (userData) {
        userData.lastActivity = Date.now() - (4 * 60 * 1000); // Set to 4 mins ago so they go offline in next check
        activeUsers.set(userId, userData);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`API + Socket server running on http://localhost:${PORT}`);
});
