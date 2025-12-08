// server/models/Link.js
const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    title: { type: String },
    slug: { type: String, required: true, unique: true },
    targetUrl: { type: String, required: true },

    password: { type: String, default: null },
    isOneTime: { type: Boolean, default: false },
    maxClicks: { type: Number, default: 0 }, // 0 = unlimited
    expiresAt: { type: Date, default: null },
    showPreview: { type: Boolean, default: false },
    collection: { type: String, default: 'General' },
    scheduleStart: { type: Date, default: null },

    clicks: { type: Number, default: 0 },
    status: { type: String, default: 'active' },

    // Creator info
    creatorName: { type: String, default: 'Anonymous' },
    creatorAvatar: { type: String, default: null }, // URL to creator's avatar

    // Favorites / Highlights
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Link', linkSchema);
