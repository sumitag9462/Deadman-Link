// server/routes/linkRoutes.js
const express = require('express');
const router = express.Router();
const Link = require('../models/Link');
const crypto = require('crypto');

// simple slug generator
async function generateUniqueSlug(customSlug) {
  if (customSlug) {
    const exists = await Link.findOne({ slug: customSlug });
    if (exists) throw new Error('Slug already in use');
    return customSlug;
  }

  let slug;
  let exists = true;
  while (exists) {
    slug = crypto.randomBytes(3).toString('hex'); // 6-char slug
    exists = await Link.findOne({ slug });
  }
  return slug;
}

// POST /api/links  -> create link
router.post('/', async (req, res) => {
  try {
    const {
      targetUrl,
      slug,
      title,
      password,
      maxClicks,
      expiresAt,
      showPreview,
      collection,
      scheduleStart,
    } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ message: 'targetUrl is required' });
    }

    // normalize maxClicks
    let finalMaxClicks = null;
    if (maxClicks !== null && maxClicks !== undefined && maxClicks !== 0) {
      const num = Number(maxClicks);
      if (!Number.isInteger(num) || num <= 0) {
        return res
          .status(400)
          .json({ message: 'maxClicks must be a positive integer or 0' });
      }
      finalMaxClicks = num;
    }

    const finalSlug = await generateUniqueSlug(slug);

    // TODO: real password hashing later (bcrypt)
    const passwordHash = password ? `PLAIN:${password}` : null;

    const link = await Link.create({
      slug: finalSlug,
      targetUrl,
      title,
      passwordHash,
      maxClicks: finalMaxClicks,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      showPreview: !!showPreview,
      collection: collection || 'General',
      scheduleStart: scheduleStart ? new Date(scheduleStart) : null,
    });

    res.status(201).json(link);
  } catch (err) {
    console.error(err);
    if (err.message === 'Slug already in use') {
      return res.status(409).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
