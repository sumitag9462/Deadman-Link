// server/routes/analyticsInsights.js
const express = require('express');
const router = express.Router();
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Link = require('../models/Link');
const mongoose = require('mongoose');

/**
 * GET /api/analytics/insights?linkId=<id>&days=14
 *
 * returns: {
 *   linkId,
 *   summary, // natural language
 *   peakHours: [{ hour: 13, avg: 4.2 }, ...],
 *   spikes: [{ start: '2025-12-08T13:00:00Z', count: 20, z: 4.1 }, ...],
 *   series: { hourly: [{ ts: '2025-12-08T13:00:00Z', count: 3 }, ...], daily: [...] },
 *   predictedExhaustion: { willExhaust: true|false, eta: '2025-12-20T..Z', remainingClicks: 123, ratePerDay: 2.5 }
 * }
 */
router.get('/', async (req, res) => {
  try {
    const { linkId } = req.query;
    const days = Math.max(1, Math.min(90, Number(req.query.days || 14)));

    if (!linkId || !mongoose.Types.ObjectId.isValid(linkId)) {
      return res.status(400).json({ message: 'linkId is required and must be valid' });
    }

    // timeframe
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    // 1) hourly aggregation
    const hourlyAgg = await AnalyticsEvent.aggregate([
      { $match: { link: mongoose.Types.ObjectId(linkId), createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            hour: { $hour: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          ts: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
              hour: '$_id.hour',
            },
          },
          count: 1,
        },
      },
      { $sort: { ts: 1 } },
    ]);

    // convert hourlyAgg to a dense hourly series (fill zeros)
    const hourlySeriesMap = new Map();
    hourlyAgg.forEach((r) => hourlySeriesMap.set(r.ts.toISOString(), r.count));

    // build hourly series between start..end
    const hourly = [];
    for (let t = new Date(start); t <= end; t.setHours(t.getHours() + 1)) {
      const iso = new Date(t).toISOString();
      hourly.push({ ts: iso, count: hourlySeriesMap.get(iso) || 0 });
    }

    // daily aggregation
    const dailyAgg = await AnalyticsEvent.aggregate([
      { $match: { link: mongoose.Types.ObjectId(linkId), createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          ts: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
            },
          },
          count: 1,
        },
      },
      { $sort: { ts: 1 } },
    ]);

    const daily = dailyAgg.map((r) => ({ ts: r.ts.toISOString(), count: r.count }));

    // 2) Peak hours (average count per hour of day across days)
    const hourBuckets = Array.from({ length: 24 }, () => ({ total: 0, slots: 0 }));
    hourly.forEach((h) => {
      const d = new Date(h.ts);
      const hr = d.getUTCHours(); // use UTC for consistency
      hourBuckets[hr].total += h.count;
      hourBuckets[hr].slots += 1;
    });

    const peaks = hourBuckets
      .map((b, hr) => ({ hour: hr, avg: b.slots ? b.total / b.slots : 0 }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);

    // 3) Spike detection using z-score on hourly counts
    const counts = hourly.map((h) => h.count);
    const mean = counts.reduce((s, v) => s + v, 0) / Math.max(1, counts.length);
    const variance = counts.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, counts.length);
    const std = Math.sqrt(variance) || 1;
    const spikes = [];
    hourly.forEach((h) => {
      const z = (h.count - mean) / std;
      if (z >= 3) {
        spikes.push({ ts: h.ts, count: h.count, z: Number(z.toFixed(2)) });
      }
    });

    // 4) Predicted exhaustion
    const link = await Link.findById(linkId).lean();
    let predictedExhaustion = { willExhaust: false, eta: null, remainingClicks: null, ratePerDay: 0 };

    if (link && link.maxClicks && link.maxClicks > 0) {
      // compute total clicks so far
      const totalClicks = await AnalyticsEvent.countDocuments({ link: mongoose.Types.ObjectId(linkId), createdAt: { $gte: new Date(0), $lte: new Date() } });

      const remaining = Math.max(0, link.maxClicks - totalClicks);

      // compute recent daily rate using exponential smoothing on daily series (alpha = 0.4)
      const alpha = 0.4;
      let ema = null;
      const dailyCounts = daily.map((d) => d.count).slice(-Math.min(30, daily.length)); // up to 30 days
      for (const c of dailyCounts) {
        ema = ema === null ? c : alpha * c + (1 - alpha) * ema;
      }
      const ratePerDay = ema || (dailyCounts.length ? dailyCounts.reduce((s, v) => s + v, 0) / dailyCounts.length : 0);

      let eta = null;
      let willExhaust = false;
      if (ratePerDay > 0) {
        willExhaust = remaining > 0;
        const daysToExhaust = remaining / ratePerDay;
        eta = new Date(Date.now() + daysToExhaust * 24 * 60 * 60 * 1000).toISOString();
      }

      predictedExhaustion = {
        willExhaust,
        eta,
        remainingClicks: remaining,
        ratePerDay: Number((ratePerDay).toFixed(2)),
      };
    }

    // 5) short NLP-like summary
    const summaryParts = [];
    if (peaks.length) {
      summaryParts.push(`Peak activity around hours ${peaks.map(p => p.hour).join(', ')} (UTC).`);
    }
    if (spikes.length) {
      summaryParts.push(`Detected ${spikes.length} unusual spike(s) in the last ${days} days.`);
    }
    if (predictedExhaustion.willExhaust) {
      summaryParts.push(`Estimated exhaustion in ~${predictedExhaustion.ratePerDay > 0 ? Math.round(predictedExhaustion.remainingClicks / predictedExhaustion.ratePerDay) : 'N/A'} days (eta ${predictedExhaustion.eta}).`);
    }

    const summary = summaryParts.length ? summaryParts.join(' ') : 'No significant events detected in the selected period.';

    return res.json({
      linkId,
      summary,
      peakHours: peaks,
      spikes,
      series: { hourly, daily },
      predictedExhaustion,
    });
  } catch (err) {
    console.error('Error /api/analytics/insights', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
