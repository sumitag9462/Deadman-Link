const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

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

// ---- Link model (same fields as your in-memory object) ----
const linkSchema = new mongoose.Schema(
  {
    title: { type: String },
    slug: { type: String, required: true, unique: true },
    targetUrl: { type: String, required: true },

    // security / rules
    password: { type: String, default: null }, // TODO: hash later
    isOneTime: { type: Boolean, default: false },
    maxClicks: { type: Number, default: 0 }, // 0 = unlimited
    expiresAt: { type: Date, default: null },
    showPreview: { type: Boolean, default: false },
    collection: { type: String, default: 'General' },
    scheduleStart: { type: Date, default: null },

    // status / tracking
    clicks: { type: Number, default: 0 },
    status: { type: String, default: 'active' }, // active | expired
  },
  { timestamps: true }
);

const Link = mongoose.model('Link', linkSchema);

// ---------------- ROUTES ---------------- //

// health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/links - list all links (for now, all users)
app.get('/api/links', async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (err) {
    console.error('Error fetching links:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/links/:slug - fetch a single link and apply read-only rules
app.get('/api/links/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const link = await Link.findOne({ slug });
    if (!link) {
      return res.status(404).json({ status: 'not_found' });
    }

    const now = new Date();

    // EXPIRY CHECK
    if (link.expiresAt) {
      if (now > link.expiresAt) {
        if (link.status !== 'expired') {
          link.status = 'expired';
          await link.save();
        }
        return res.status(200).json({
          status: 'expired',
          reason: 'Link has self-destructed.',
        });
      }
    }

    // CLICK LIMIT CHECK (one-time / multi-use)
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
    if (link.scheduleStart) {
      if (now < link.scheduleStart) {
        return res.status(200).json({
          status: 'scheduled',
          reason: 'Link is not active yet.',
          startsAt: link.scheduleStart,
        });
      }
    }

    // ACTIVE LINK
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
    } = req.body || {};

    if (!url) {
      return res.status(400).json({ message: 'url is required' });
    }

    // If user provided a slug, validate uniqueness
    let finalSlug;
    if (slug && slug.trim()) {
      const normalizedSlug = slug.trim();
      const alreadyExists = await Link.findOne({ slug: normalizedSlug });
      if (alreadyExists) {
        return res.status(409).json({ message: 'Slug already taken' });
      }
      finalSlug = normalizedSlug;
    } else {
      // Simple slug generation if not provided
      finalSlug = Math.random().toString(36).substring(2, 8);
      // Ensure slug is unique in DB
      let exists = await Link.findOne({ slug: finalSlug });
      while (exists) {
        finalSlug = Math.random().toString(36).substring(2, 8);
        exists = await Link.findOne({ slug: finalSlug });
      }
    }

    // normalize fields
    const now = new Date();

    const newLink = await Link.create({
      title: title || url,
      slug: finalSlug,
      targetUrl: url,
      clicks: 0,
      status: 'active',
      createdAt: now,

      password: password || null, // TODO: hash later
      isOneTime: !!isOneTime,
      maxClicks: maxClicks || 0, // 0 = unlimited
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      showPreview: !!showPreview,
      collection: collection || 'General',
      scheduleStart: scheduleStart ? new Date(scheduleStart) : null,
    });

    return res.status(201).json(newLink);
  } catch (err) {
    console.error('Error in POST /api/links:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// REAL REDIRECT ENDPOINT - handles clicks + limits + expiry
app.get('/r/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const link = await Link.findOne({ slug });

    if (!link) {
      return res.status(404).send('Deadman-Link: Not found');
    }

    const now = new Date();

    // EXPIRY CHECK
    if (link.expiresAt && now > link.expiresAt) {
      if (link.status !== 'expired') {
        link.status = 'expired';
        await link.save();
      }
      return res
        .status(410)
        .send('Deadman-Link: This link has self-destructed (expired).');
    }

    // SCHEDULED ACTIVATION CHECK
    if (link.scheduleStart && now < link.scheduleStart) {
      return res
        .status(403)
        .send('Deadman-Link: This link is not active yet.');
    }

    // CLICK LIMIT CHECK
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

    // Increment clicks
    link.clicks += 1;

    // If this click consumed the last allowed one, mark as expired
    if (effectiveLimit > 0 && link.clicks >= effectiveLimit) {
      link.status = 'expired';
    }

    await link.save();

    // TODO: password & preview handling will be integrated in a smarter flow later.
    // For now, this endpoint just redirects if rules allow.
    return res.redirect(link.targetUrl);
  } catch (err) {
    console.error('Error in GET /r/:slug:', err);
    res.status(500).send('Deadman-Link: Internal server error.');
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
