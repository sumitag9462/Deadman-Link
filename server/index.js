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
const AnalyticsEvent = require('./models/AnalyticsEvent');

const app = express();
// Default to a less common port to reduce local collisions
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

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

// watch party REST routes
app.use('/api/watch', watchRoutes);

// analytics REST routes (REAL data)
app.use('/api/analytics', analyticsRoutes);

// GET /api/links - list all links
app.get('/api/links', async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });
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

// POST /api/links - create a new short link
app.post('/api/links', async (req, res) => {
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
      isFavorite: false,
    });

    return res.status(201).json(newLink);
  } catch (err) {
    console.error('Error in POST /api/links:', err);
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

// REAL REDIRECT ENDPOINT + analytics logging
app.get('/r/:slug', async (req, res) => {
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

    const country =
      req.headers['cf-ipcountry'] ||
      req.headers['x-country'] ||
      'Unknown';

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

// PUT /api/links/:id - update link details
app.put('/api/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, targetUrl, password, isOneTime, maxClicks, expiresAt, showPreview, collection, creatorName } =
      req.body || {};

    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Update allowed fields
    if (title !== undefined) link.title = title;
    if (targetUrl !== undefined) link.targetUrl = targetUrl;
    if (password !== undefined)
      link.password = password || null;
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

// PATCH /api/links/:id/favorite - toggle favorite status
app.patch('/api/links/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    link.isFavorite = !link.isFavorite;
    const updated = await link.save();
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error in PATCH /api/links/:id/favorite:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/links/:id - delete a link
app.delete('/api/links/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Link.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: 'Link not found' });
    }

    return res.status(200).json({ message: 'Link deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /api/links/:id:', err);
    res.status(500).json({ message: 'Internal server error' });
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

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

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

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`API + Socket server running on http://localhost:${PORT}`);
});
