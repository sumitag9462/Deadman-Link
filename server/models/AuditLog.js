// server/models/AuditLog.js
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      // some common ones; not enforced strictly, just documentation
      enum: [
        'CREATE_LINK',
        'UPDATE_LINK',
        'DELETE_LINK',
        'BAN_USER',
        'UNBAN_USER',
        'UPDATE_CONFIG',
        'SYSTEM_EVENT',
        'LOGIN',
        'LOGOUT',
      ],
    },
    target: {
      type: String,
      required: true, // e.g. "slug: free-money" / "user: bot@spam.net"
    },
    adminName: {
      type: String,
      default: 'System',
    },
    adminEmail: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ adminName: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
