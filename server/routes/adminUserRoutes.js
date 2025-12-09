// server/routes/adminUserRoutes.js
const express = require('express');
const User = require('../models/User');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// Role → features mapping (single source of truth)
const ROLE_DEFINITIONS = [
  {
    id: 'user',
    label: 'User',
    description: 'Standard user with full application access.',
    features: [
      'Create Deadman Links',
      'Link analytics & insights',
      'Join Watch Parties',
      'Manage own content',
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Full operational and audit access.',
    features: [
      'Everything in User',
      'Access Admin Console',
      'Manage all links & users',
      'View audit logs & system config',
      'Ban/unban users',
    ],
  },
];

/**
 * GET /api/admin/users
 * Optional query: ?search=...&role=user|admin&status=active|banned
 */
router.get('/', async (req, res) => {
  try {
    // Ensure MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Waiting for MongoDB connection...');
      await new Promise(resolve => {
        if (mongoose.connection.readyState === 1) resolve();
        else mongoose.connection.once('open', resolve);
      });
    }

    const { search = '', role, onlineStatus, accountStatus } = req.query;
    console.log('📊 User filter request:', { search, role, onlineStatus, accountStatus });

    const q = {};

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      q.$or = [{ name: regex }, { email: regex }];
    }

    if (role && ['user', 'admin'].includes(role)) {
      q.role = role;
      console.log('✅ Role filter applied:', role);
    }

    if (onlineStatus && ['online', 'idle', 'offline'].includes(onlineStatus)) {
      q.onlineStatus = onlineStatus;
      console.log('✅ Online status filter applied:', onlineStatus);
    }

    if (accountStatus && ['active', 'banned'].includes(accountStatus)) {
      q.status = accountStatus;
      console.log('✅ Account status filter applied:', accountStatus);
    }

    console.log('📊 Final MongoDB query:', JSON.stringify(q));

    const users = await User.find(q)
      .select('-password') // Don't send password hashes
      .sort({ lastActiveAt: -1, createdAt: -1 }); // Most recently active first

    console.log('📊 Found', users.length, 'users matching query');
    if (users.length > 0) {
      console.log('Sample user:', {
        name: users[0].name,
        role: users[0].role,
        status: users[0].status,
        onlineStatus: users[0].onlineStatus
      });
    } else {
      console.log('❌ No users found. Let me check what exists in DB...');
      const allUsers = await User.find().select('name role status onlineStatus').limit(3);
      console.log('First 3 users in DB:', allUsers.map(u => ({ 
        name: u.name, 
        role: u.role, 
        status: u.status, 
        onlineStatus: u.onlineStatus 
      })));
    }

    res.json({ users });
  } catch (err) {
    console.error('Error in GET /api/admin/users:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/users/roles
 * -> role definitions & features
 */
router.get('/roles', (req, res) => {
  res.json({ roles: ROLE_DEFINITIONS });
});

// POST endpoint removed - users are created through registration only

/**
 * PATCH /api/admin/users/:id
 * Body: { role?, status? }
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    const update = {};

    if (role && ['user', 'admin'].includes(role)) {
      update.role = role;
    }

    if (status && ['active', 'banned'].includes(status)) {
      update.status = status;
    }

    if (Object.keys(update).length === 0) {
      return res
        .status(400)
        .json({ message: 'No valid fields provided to update.' });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create audit log manually based on the action
    if (req.user) {
      try {
        const AuditLog = require('../models/AuditLog');
        let action = 'UPDATE_USER';
        let target = `${updated.name} (${updated.email})`;
        
        if (status === 'banned') {
          action = 'BAN_USER';
          target = `Banned user: ${updated.name} (${updated.email})`;
        } else if (status === 'active' && req.body.status) {
          action = 'UNBAN_USER';
          target = `Unbanned user: ${updated.name} (${updated.email})`;
        } else if (role) {
          action = 'CHANGE_USER_ROLE';
          target = `Changed role to ${role}: ${updated.name} (${updated.email})`;
        }

        await AuditLog.create({
          action,
          adminId: req.user.sub || req.user._id,
          adminEmail: req.user.email,
          adminName: req.user.name || req.user.email,
          target,
          targetId: updated._id.toString(),
          details: { update, previousRole: role ? 'changed' : 'same', previousStatus: status ? 'changed' : 'same' },
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        });
        console.log(`📝 Audit log created: ${action} for ${updated.email}`);
      } catch (auditErr) {
        console.error('Failed to create audit log:', auditErr.message);
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('admin:user-updated', updated);
    }

    res.json(updated);
  } catch (err) {
    console.error('Error in PATCH /api/admin/users/:id:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
