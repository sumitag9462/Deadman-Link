// server/routes/adminLinkRoutes.js
const express = require('express');
const Link = require('../models/Link');

const router = express.Router();

/**
 * GET /api/admin/links
 * Query params:
 *  - search: text search on slug/title/targetUrl
 *  - status: 'active' | 'expired' | 'blocked' (optional)
 *  - page, limit: pagination (defaults: 1, 20)
 */
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const q = {};

    // text search
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      q.$or = [
        { slug: regex },
        { title: regex },
        { targetUrl: regex }, // or destination/originalUrl depending on your model
      ];
    }

    // status filter (only apply for valid statuses)
    if (status && ['active', 'expired', 'blocked'].includes(status)) {
      q.status = status;
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const [items, total] = await Promise.all([
      Link.find(q)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Link.countDocuments(q),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;

    // 🔥 IMPORTANT: return both the old keys (items/total/pages)
    // and the keys your frontend likely uses (links/totalLinks/totalPages)
    res.json({
      // original shape
      items,
      total,
      page: pageNum,
      pages,

      // aliases for frontend compatibility
      links: items,
      totalLinks: total,
      totalPages: pages,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/links:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/links/:id
 * Body: { status?, maxClicks? }
 * Used for toggling status etc.
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, maxClicks } = req.body;

    const update = {};
    if (status && ['active', 'expired', 'blocked'].includes(status)) {
      update.status = status;
    }
    if (typeof maxClicks === 'number') {
      update.maxClicks = maxClicks;
    }

    const updated = await Link.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error in PATCH /api/admin/links/:id:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/links/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Link.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/admin/links/:id:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
