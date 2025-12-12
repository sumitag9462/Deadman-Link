// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser'); // adjust if your user model file name is different
const secret = process.env.JWT_SECRET;

async function ensureAuthenticated(req, res, next) {
  try {
    const header = req.headers['authorization'] || req.headers['Authorization'];
    if (!header) {
      return res.status(401).json({ message: 'Missing authorization token' });
    }

    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid authorization header format' });
    }

    const token = parts[1];
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // payload should contain an identifier (id, sub, or email depending on your token creation)
    const userId = payload.id || payload.sub || payload.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Token missing user id' });
    }

    const user = await AdminUser.findById(userId).lean();
    if (!user) {
      return res.status(401).json({ message: 'Invalid token user' });
    }

    // Attach a cleaned object to req.user (avoid attaching mongoose doc)
    req.user = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      timezone: user.timezone,
      avatarColor: user.avatarColor,
      privacy: user.privacy || {},
    };

    next();
  } catch (err) {
    console.error('ensureAuthenticated error', err);
    return res.status(500).json({ message: 'Authentication middleware failure' });
  }
}

module.exports = {
  ensureAuthenticated,
};
