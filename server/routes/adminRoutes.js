// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const Link = require('../models/Link');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { logAuditEvent } = require('../scripts/auditLogger'); // ⬅️ NEW

// GET /api/admin/overview
// Returns system-wide aggregate metrics for the admin dashboard
router.get('/overview', async (req, res) => {
  try {
    // Basic counts from DB
    const [totalLinks, activeLinks, clickAgg, uniqueIps] = await Promise.all([
      Link.countDocuments({}),
      Link.countDocuments({ status: 'active' }),
      AnalyticsEvent.aggregate([
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            mobileClicks: {
              $sum: {
                $cond: [{ $eq: ['$deviceType', 'mobile'] }, 1, 0],
              },
            },
          },
        },
      ]),
      AnalyticsEvent.distinct('ip'),
    ]);

    const totalClicks = clickAgg[0]?.totalClicks ?? 0;
    const mobileClicks = clickAgg[0]?.mobileClicks ?? 0;
    const uniqueVisitors = uniqueIps.length;
    const mobilePercent =
      totalClicks > 0
        ? Math.round((mobileClicks / totalClicks) * 100)
        : 0;

    // Clicks over last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 6); // last 7 days including today

    const timelineAgg = await AnalyticsEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          clicks: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const timeline = timelineAgg.map((row) => ({
      date: row._id,
      clicks: row.clicks,
    }));

    // "Recent system alerts" – for now, use recent analytics events
    const recentEventsRaw = await AnalyticsEvent.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('slug ip country createdAt');

    const recentEvents = recentEventsRaw.map((ev) => ({
      id: ev._id.toString(),
      message: `Link /${ev.slug} clicked from ${
        ev.country || 'Unknown'
      } (${ev.ip || 'unknown IP'})`,
      createdAt: ev.createdAt,
    }));

    // 🔎 NEW: log that an admin viewed the overview dashboard
    // Later you can replace 'Admin Console' with real admin identity from auth.
    await logAuditEvent({
      action: 'SYSTEM_EVENT',
      target: 'VIEW_ADMIN_OVERVIEW',
      adminName: 'Admin Console',
      ipAddress: req.ip,
      metadata: {
        totalLinks,
        totalClicks,
      },
    });

    res.json({
      totalLinks,
      totalClicks,
      activeLinks,
      uniqueVisitors,
      mobilePercent,
      timeline,
      recentEvents,
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ message: 'Failed to load admin overview' });
  }
});

module.exports = router;
