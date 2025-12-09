// server/routes/linkRoutes.js
const express = require('express');
const router = express.Router();
const Link = require('../models/Link');
const AuditLog = require('../models/AuditLog');
const SystemSettings = require('../models/SystemSettings');
const FlagReport = require('../models/FlagReport');
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

// GET /api/links/public - fetch all public/active links (for community browsing)
router.get('/public', async (req, res) => {
  try {
    const links = await Link.find({ 
      status: 'active' // Only show active links
    })
    .sort({ createdAt: -1 })
    .limit(500) // Limit to prevent overwhelming the client
    .select('slug targetUrl title clicks createdAt ownerEmail password showPreview isOneTime maxClicks collection');

    res.json(links);
  } catch (err) {
    console.error('Error fetching public links:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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

    // Get system settings for maxLinkTTL and banned keywords
    const settings = await SystemSettings.getSettings();
    const maxLinkTTL = settings?.maxLinkTTL || 30; // days
    const bannedKeywords = settings?.bannedKeywords || [];
    const autoFlagBannedKeywords = settings?.autoFlagBannedKeywords !== false;

    // Check for banned keywords in targetUrl and title
    const textToCheck = `${targetUrl} ${title || ''}`.toLowerCase();
    const foundKeyword = bannedKeywords.find(keyword => 
      textToCheck.includes(keyword.toLowerCase())
    );

    if (foundKeyword && autoFlagBannedKeywords) {
      // Create link but immediately flag it
      const finalSlugPrecheck = await generateUniqueSlug(slug);
      
      const link = await Link.create({
        slug: finalSlugPrecheck,
        targetUrl,
        title,
        passwordHash: password ? `PLAIN:${password}` : null,
        maxClicks: maxClicks || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        showPreview: !!showPreview,
        collection: collection || 'General',
        scheduleStart: scheduleStart ? new Date(scheduleStart) : null,
        createdBy: req.user?._id || req.user?.sub || null,
        ownerEmail: req.user?.email || null,
        status: 'blocked', // Auto-block links with banned keywords
      });

      // Auto-create a high-priority report
      await FlagReport.create({
        linkId: link._id,
        reportedBy: null, // System-generated
        reporterEmail: 'system@auto-moderation',
        reason: 'OTHER',
        description: `Link automatically flagged for containing banned keyword: "${foundKeyword}"`,
        status: 'PENDING',
        priority: 'HIGH',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      return res.status(201).json({ 
        message: 'Link created but blocked due to policy violation',
        link,
        blocked: true,
        reason: 'Contains banned content'
      });
    }

    // Validate expiresAt against maxLinkTTL
    let finalExpiresAt = null;
    if (expiresAt) {
      const expireDate = new Date(expiresAt);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + maxLinkTTL);
      
      if (expireDate > maxDate) {
        return res.status(400).json({ 
          message: `Link expiration cannot exceed ${maxLinkTTL} days from now` 
        });
      }
      finalExpiresAt = expireDate;
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
      expiresAt: finalExpiresAt,
      showPreview: !!showPreview,
      collection: collection || 'General',
      scheduleStart: scheduleStart ? new Date(scheduleStart) : null,
      createdBy: req.user?._id || req.user?.sub || null,
      ownerEmail: req.user?.email || null,
    });

    // Log admin link creation
    if (req.user && req.user.role === 'admin') {
      try {
        await AuditLog.create({
          action: 'CREATE_LINK',
          adminId: req.user.sub || req.user._id,
          adminEmail: req.user.email,
          adminName: req.user.name || req.user.email,
          target: `/${finalSlug} → ${targetUrl}`,
          targetId: link._id.toString(),
          details: { 
            slug: finalSlug, 
            targetUrl,
            hasPassword: !!password,
            maxClicks: finalMaxClicks,
            expiresAt 
          },
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        });
        console.log(`📝 Admin created link: /${finalSlug}`);
      } catch (auditErr) {
        console.error('Failed to log link creation:', auditErr.message);
      }
    }

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
