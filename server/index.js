// server/index.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const https = require('https'); // for webhook requests
const { Server } = require('socket.io');
require('dotenv').config();

const watchRoutes = require('./routes/watchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const Link = require('./models/Link');
const AnalyticsEvent = require('./models/AnalyticsEvent');
const adminRoutes = require('./routes/adminRoutes');
const adminLinkRoutes = require('./routes/adminLinkRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const adminAuditRoutes = require('./routes/adminAuditRoutes');
const securityRoutes = require('./routes/securityRoutes');
const { basicUrlSafetyCheck } = require('./scripts/urlSafety');
const linkRoutes = require('./routes/linkRoutes');


const app = express();
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

// admin link management routes (more specific -> mount first)
app.use('/api/admin/links', adminLinkRoutes);

// other admin routes
app.use('/api/admin', adminRoutes);

// admin user access controls
app.use('/api/admin/users', adminUserRoutes);

// system settings
app.use('/api/settings', settingsRoutes);

// admin audit-log routes
app.use('/api/admin/audit-logs', adminAuditRoutes);

// security / URL scan API
app.use('/api/security', securityRoutes);

// similarity / helper link routes
app.use('/api/links', linkRoutes);


// ---------------- LINK CRUD ---------------- //

// GET /api/links - list links, optionally filtered by ownerEmail
app.get('/api/links', async (req, res) => {
  try {
    const { ownerEmail } = req.query;
    const query = {};

    if (ownerEmail) {
      query.ownerEmail = ownerEmail;
    }

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
      const wasExpired = link.status === 'expired';
      if (!wasExpired) {
        link.status = 'expired';
        await link.save();

        sendWebhook(link, 'expired', {
          reason: 'time_expired',
          source: 'status_check',
        });
      }
      return res.status(200).json({
        status: 'expired',
        reason: 'Link has self-destructed.',
      });
    }

    // CLICK LIMIT CHECK
    const effectiveLimit = link.isOneTime ? 1 : link.maxClicks || 0;
    if (effectiveLimit > 0 && link.clicks >= effectiveLimit) {
      const wasExpired = link.status === 'expired';
      if (!wasExpired) {
        link.status = 'expired';
        await link.save();

        sendWebhook(link, 'expired', {
          reason: 'max_clicks_status_check',
          source: 'status_check',
        });
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

// POST /api/links - create a new short link (now with safety scan)
app.post('/api/links', async (req, res) => {
  try {
    console.log('POST /api/links body:', req.body); // 🔍 debug

    const {
      url,
      targetUrl,
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
      conditionalRedirect,
      webhookConfig,
      visibility,
    } = req.body || {};

    // accept either `url` or `targetUrl`
    const finalUrl = (url || targetUrl || '').trim();

    if (!finalUrl) {
      return res
        .status(400)
        .json({ message: 'destination url is required' }); // 🔴 new text
    }
    const finalVisibility =
  visibility === 'private' ? 'private' : 'public';


    // 🧠 run heuristic safety scan for this URL
    const safety = basicUrlSafetyCheck(finalUrl);

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
      title: title || finalUrl,
      slug: finalSlug,
      targetUrl: finalUrl,
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

       visibility: finalVisibility,

      conditionalRedirect: conditionalRedirect || undefined,
      webhookConfig: webhookConfig || undefined,

      // 🧠 store safety result
      safetyScore: safety.score,
      safetyVerdict: safety.verdict,
      isFlagged: safety.flagRecommended,
      flagReason: safety.flagRecommended
        ? 'auto_flag_safety_scanner'
        : null,
      flaggedAt: safety.flagRecommended ? now : null,
      moderationStatus: safety.flagRecommended ? 'flagged' : 'clean',
    });

    return res.status(201).json(newLink);
  } catch (err) {
    console.error('Error in POST /api/links:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// PUT /api/links/:id - update link details
app.put('/api/links/:id', async (req, res) => {
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
      conditionalRedirect,
      webhookConfig,
    } = req.body || {};

    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

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
    if (conditionalRedirect !== undefined) {
      link.conditionalRedirect = conditionalRedirect;
    }
    if (webhookConfig !== undefined) {
      link.webhookConfig = webhookConfig;
    }
    if (visibility !== undefined) {
  link.visibility =
    visibility === 'private' ? 'private' : 'public';
}


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

// ---- helper: choose conditional redirect target ----
function chooseConditionalTarget(link, deviceType, now, clickCount) {
  const rules = link.conditionalRedirect;
  if (!rules || !rules.enabled) return null;

  // 1) Device-based rules
  if (rules.deviceRules) {
    const d = (deviceType || '').toLowerCase();
    if (d === 'mobile' && rules.deviceRules.mobileUrl) {
      return rules.deviceRules.mobileUrl;
    }
    if (d === 'desktop' && rules.deviceRules.desktopUrl) {
      return rules.deviceRules.desktopUrl;
    }
    if (d === 'tablet' && rules.deviceRules.tabletUrl) {
      return rules.deviceRules.tabletUrl;
    }
    if (d === 'bot' && rules.deviceRules.botUrl) {
      return rules.deviceRules.botUrl;
    }
  }

  // 2) Weekday / weekend rules
  if (rules.dayTypeRules) {
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;
    if (isWeekend && rules.dayTypeRules.weekendUrl) {
      return rules.dayTypeRules.weekendUrl;
    }
    if (!isWeekend && rules.dayTypeRules.weekdayUrl) {
      return rules.dayTypeRules.weekdayUrl;
    }
  }

  // 3) Time-of-day rules
  if (Array.isArray(rules.timeOfDayRules) && rules.timeOfDayRules.length) {
    const hour = now.getHours(); // 0–23
    for (const win of rules.timeOfDayRules) {
      if (
        typeof win.startHour !== 'number' ||
        typeof win.endHour !== 'number' ||
        !win.url
      ) {
        continue;
      }

      if (win.startHour <= win.endHour) {
        // simple case: [start, end)
        if (hour >= win.startHour && hour < win.endHour) {
          return win.url;
        }
      } else {
        // wraps midnight, e.g. 22–3
        if (hour >= win.startHour || hour < win.endHour) {
          return win.url;
        }
      }
    }
  }

  // 4) Click-count rules
  if (Array.isArray(rules.clickRules) && rules.clickRules.length) {
    for (const r of rules.clickRules) {
      if (!r || !r.url) continue;
      const min = typeof r.minClicks === 'number' ? r.minClicks : 0;
      const max =
        typeof r.maxClicks === 'number' ? r.maxClicks : null;

      if (clickCount >= min && (max === null || clickCount <= max)) {
        return r.url;
      }
    }
  }

  return null;
}

// ---- helper: send webhook (fire-and-forget, using http/https) ----
function sendWebhook(link, eventType, extra = {}) {
  const cfg = link.webhookConfig;
  if (!cfg || !cfg.enabled || !cfg.url) return;

  const triggers = cfg.triggers || {};

  if (
    (eventType === 'first_click' && !triggers.onFirstClick) ||
    (eventType === 'expired' && !triggers.onExpiry) ||
    (eventType === 'one_time_completed' &&
      !triggers.onOneTimeComplete)
  ) {
    return;
  }

  let urlObj;
  try {
    urlObj = new URL(cfg.url);
  } catch (e) {
    console.error('Invalid webhook URL:', cfg.url, e.message);
    return;
  }

  const payload = {
    event: eventType,
    linkId: link._id.toString(),
    slug: link.slug,
    targetUrl: link.targetUrl,
    isOneTime: link.isOneTime,
    maxClicks: link.maxClicks,
    clicks: link.clicks,
    status: link.status,
    occurredAt: new Date().toISOString(),
    ...extra,
  };

  const body = JSON.stringify(payload);

  const isHttps = urlObj.protocol === 'https:';
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (isHttps ? 443 : 80),
    path: urlObj.pathname + (urlObj.search || ''),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  if (cfg.secret) {
    options.headers['x-deadman-secret'] = cfg.secret;
  }

  const client = isHttps ? https : http;

  console.log(
    `📡 Sending webhook to ${cfg.url} [event=${eventType}]`
  );

  const req = client.request(options, (res) => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.error(
        `Webhook responded with status ${res.statusCode} for ${cfg.url}`
      );
    }
  });

  req.on('error', (err) => {
    console.error('Webhook call failed:', err.message);
  });

  req.write(body);
  req.end();
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

    // expiry check (time-based)
    if (link.expiresAt && now > link.expiresAt) {
      const wasExpired = link.status === 'expired';
      if (!wasExpired) {
        link.status = 'expired';
        await link.save();

        sendWebhook(link, 'expired', {
          reason: 'time_expired',
          source: 'redirect',
        });
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

    // click limit check BEFORE increment
    const effectiveLimit = link.isOneTime ? 1 : link.maxClicks || 0;
    if (effectiveLimit > 0 && link.clicks >= effectiveLimit) {
      const wasExpired = link.status === 'expired';
      if (!wasExpired) {
        link.status = 'expired';
        await link.save();

        sendWebhook(link, 'expired', {
          reason: 'max_clicks',
          source: 'redirect_pre_click',
        });
      }
      return res
        .status(410)
        .send(
          'Deadman-Link: This link has reached its maximum allowed clicks.'
        );
    }

    const userAgent = req.headers['user-agent'] || '';
    const deviceType = getDeviceType(userAgent);

    const newClickCount = link.clicks + 1;
    const isFirstClick = newClickCount === 1;
    let expiredByLimitThisClick = false;

    let finalTargetUrl = link.targetUrl;
    const conditionalTarget = chooseConditionalTarget(
      link,
      deviceType,
      now,
      newClickCount
    );
    if (conditionalTarget) {
      finalTargetUrl = conditionalTarget;
    }

    link.clicks = newClickCount;
    if (effectiveLimit > 0 && link.clicks >= effectiveLimit) {
      if (link.status !== 'expired') {
        link.status = 'expired';
        expiredByLimitThisClick = true;
      }
    }
    await link.save();

    // ---- log analytics event (non-blocking) ----
    const ipRaw =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ip = Array.isArray(ipRaw)
      ? ipRaw[0]
      : ipRaw.split(',')[0].trim();

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
    }

    // ---- trigger webhooks based on events ----
    if (isFirstClick) {
      sendWebhook(link, 'first_click', {
        source: 'redirect',
        deviceType,
        ip,
        country,
      });
    }

    if (expiredByLimitThisClick) {
      sendWebhook(link, 'expired', {
        reason: 'max_clicks',
        source: 'redirect_post_click',
      });

      if (link.isOneTime) {
        sendWebhook(link, 'one_time_completed', {
          reason: 'click_limit_reached',
          source: 'redirect',
        });
      }
    }

    return res.redirect(finalTargetUrl);
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
