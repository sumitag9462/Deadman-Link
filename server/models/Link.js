const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    targetUrl: { type: String, required: true },
    title: { type: String },
    passwordHash: { type: String }, // we'll wire real hashing later
    maxClicks: { type: Number, default: null }, // null = unlimited
    clickCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    showPreview: { type: Boolean, default: false },
    collection: { type: String, default: 'General' },
    scheduleStart: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Link', linkSchema);
