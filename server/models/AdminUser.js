// server/models/AdminUser.js
const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // access control
    role: {
      type: String,
      enum: ['regular', 'premium', 'admin'],
      default: 'regular',
    },
    status: {
      type: String,
      enum: ['active', 'banned'],
      default: 'active',
    },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminUser', AdminUserSchema);
