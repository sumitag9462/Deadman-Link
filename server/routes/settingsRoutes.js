// server/routes/settingsRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');
const Link = require('../models/Link');
const AnalyticsEvent = require('../models/AnalyticsEvent');

const router = express.Router();

// helper: find or create user by email
async function findOrCreateUserByEmail(email, nameFallback) {
  let user = await AdminUser.findOne({ email });

  if (!user) {
    user = await AdminUser.create({
      email,
      name: nameFallback || email.split('@')[0],
    });
  }

  return user;
}

/**
 * GET /api/settings?email=...
 * Returns profile + all settings for a user.
 */
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await findOrCreateUserByEmail(email);

    const notif = user.notificationSettings || {};
    const def = user.defaultSettings || {};
    const privacy = user.privacy || {};
    const sec = user.securitySettings || {};
    const auto = user.autoDestructRules || {};

    res.json({
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      timezone: user.timezone,

      notifications: {
        emailOnDestruction: notif.emailOnDestruction ?? true,
        suspiciousActivity: notif.suspiciousActivity ?? true,
      },

      defaultSettings: {
        collection: def.collection ?? 'General',
        showPreview: def.showPreview ?? true,
        maxClicks: def.maxClicks ?? 0,
        isOneTime: def.isOneTime ?? false,
      },

      privacy: {
        showCreatorName: privacy.showCreatorName ?? true,
        enableReferrerTracking: privacy.enableReferrerTracking ?? true,
      },

      securitySettings: {
        notifyNewDevice: sec.notifyNewDevice ?? true,
        notifyFailedAttempt: sec.notifyFailedAttempt ?? true,
      },

      autoDestructRules: {
        expireAfterDays: auto.expireAfterDays ?? null,
        destroyOnFirstClick: auto.destroyOnFirstClick ?? false,
      },

      twoFactorEnabled: user.twoFactorEnabled ?? false,

      sessions: user.sessions || [],
    });
  } catch (err) {
    console.error('Error in GET /api/settings:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/settings/profile
 * Body: { email, name, avatarColor?, timezone? }
 */
router.put('/profile', async (req, res) => {
  try {
    const { email, name, avatarColor, timezone } = req.body || {};

    if (!email || !name) {
      return res
        .status(400)
        .json({ message: 'email and name are required' });
    }

    const user = await findOrCreateUserByEmail(email);
    user.name = name;

    if (avatarColor) {
      user.avatarColor = avatarColor;
    }
    if (timezone) {
      user.timezone = timezone;
    }

    await user.save();

    res.json({
      message: 'Profile updated',
      user: {
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        timezone: user.timezone,
      },
    });
  } catch (err) {
    console.error('Error in PUT /api/settings/profile:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/settings/notifications
 * Body: { email, notifications: { emailOnDestruction, suspiciousActivity } }
 */
router.put('/notifications', async (req, res) => {
  try {
    const { email, notifications } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await findOrCreateUserByEmail(email);

    user.notificationSettings = {
      emailOnDestruction:
        notifications?.emailOnDestruction ??
        user.notificationSettings.emailOnDestruction ??
        true,
      suspiciousActivity:
        notifications?.suspiciousActivity ??
        user.notificationSettings.suspiciousActivity ??
        true,
    };

    await user.save();

    res.json({
      message: 'Notification settings updated',
      notifications: user.notificationSettings,
    });
  } catch (err) {
    console.error('Error in PUT /api/settings/notifications:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/settings/password
 * Body: { email, currentPassword, newPassword }
 */
router.put('/password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body || {};

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: 'email and newPassword are required' });
    }

    const user = await findOrCreateUserByEmail(email);

    // If a password already exists, verify currentPassword
    if (user.passwordHash) {
      const ok = await bcrypt.compare(
        currentPassword || '',
        user.passwordHash
      );
      if (!ok) {
        return res
          .status(401)
          .json({ message: 'Current password is incorrect' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error in PUT /api/settings/password:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/settings/preferences
 * Body:
 * {
 *   email,
 *   avatarColor?,
 *   timezone?,
 *   defaultSettings: { collection, showPreview, maxClicks, isOneTime },
 *   privacy: { showCreatorName, enableReferrerTracking },
 *   autoDestructRules: { expireAfterDays, destroyOnFirstClick }
 * }
 */
router.put('/preferences', async (req, res) => {
  try {
    const {
      email,
      avatarColor,
      timezone,
      defaultSettings,
      privacy,
      autoDestructRules,
    } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await findOrCreateUserByEmail(email);

    if (avatarColor !== undefined) user.avatarColor = avatarColor;
    if (timezone !== undefined) user.timezone = timezone;

    if (defaultSettings) {
      user.defaultSettings = {
        collection:
          defaultSettings.collection ??
          user.defaultSettings.collection ??
          'General',
        showPreview:
          defaultSettings.showPreview ??
          user.defaultSettings.showPreview ??
          true,
        maxClicks:
          defaultSettings.maxClicks ??
          user.defaultSettings.maxClicks ??
          0,
        isOneTime:
          defaultSettings.isOneTime ??
          user.defaultSettings.isOneTime ??
          false,
      };
    }

    if (privacy) {
      user.privacy = {
        showCreatorName:
          privacy.showCreatorName ??
          user.privacy.showCreatorName ??
          true,
        enableReferrerTracking:
          privacy.enableReferrerTracking ??
          user.privacy.enableReferrerTracking ??
          true,
      };
    }

    if (autoDestructRules) {
      user.autoDestructRules = {
        expireAfterDays:
          autoDestructRules.expireAfterDays ??
          user.autoDestructRules.expireAfterDays ??
          null,
        destroyOnFirstClick:
          autoDestructRules.destroyOnFirstClick ??
          user.autoDestructRules.destroyOnFirstClick ??
          false,
      };
    }

    await user.save();

    res.json({
      message: 'Preferences updated',
    });
  } catch (err) {
    console.error('Error in PUT /api/settings/preferences:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/settings/security-advanced
 * Body: { email, twoFactorEnabled, securitySettings: { notifyNewDevice, notifyFailedAttempt } }
 */
router.put('/security-advanced', async (req, res) => {
  try {
    const { email, twoFactorEnabled, securitySettings } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await findOrCreateUserByEmail(email);

    if (twoFactorEnabled !== undefined) {
      user.twoFactorEnabled = !!twoFactorEnabled;
    }

    if (securitySettings) {
      user.securitySettings = {
        notifyNewDevice:
          securitySettings.notifyNewDevice ??
          user.securitySettings.notifyNewDevice ??
          true,
        notifyFailedAttempt:
          securitySettings.notifyFailedAttempt ??
          user.securitySettings.notifyFailedAttempt ??
          true,
      };
    }

    await user.save();

    res.json({
      message: 'Security settings updated',
      twoFactorEnabled: user.twoFactorEnabled,
      securitySettings: user.securitySettings,
    });
  } catch (err) {
    console.error('Error in PUT /api/settings/security-advanced:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/settings/export?email=...
 * Returns user + their links + analytics events
 */
router.get('/export', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await AdminUser.findOne({ email });
    const links = await Link.find({ ownerEmail: email });
    const events = await AnalyticsEvent.find({
      slug: { $in: links.map((l) => l.slug) },
    });

    res.json({
      user,
      links,
      analyticsEvents: events,
    });
  } catch (err) {
    console.error('Error in GET /api/settings/export:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/settings/reset-data
 * Body: { email }
 * Deletes all links (and analytics) for that user, but keeps account.
 */
router.post('/reset-data', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const links = await Link.find({ ownerEmail: email });
    const slugs = links.map((l) => l.slug);

    await Link.deleteMany({ ownerEmail: email });
    await AnalyticsEvent.deleteMany({ slug: { $in: slugs } });

    res.json({ message: 'All your links and analytics were deleted.' });
  } catch (err) {
    console.error('Error in POST /api/settings/reset-data:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/settings/delete-account
 * Body: { email }
 * Deletes user + their links + analytics.
 */
router.delete('/delete-account', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const links = await Link.find({ ownerEmail: email });
    const slugs = links.map((l) => l.slug);

    await Link.deleteMany({ ownerEmail: email });
    await AnalyticsEvent.deleteMany({ slug: { $in: slugs } });
    await AdminUser.deleteOne({ email });

    res.json({ message: 'Account and all data deleted.' });
  } catch (err) {
    console.error('Error in DELETE /api/settings/delete-account:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
