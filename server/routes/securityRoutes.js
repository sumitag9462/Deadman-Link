// server/routes/securityRoutes.js
const express = require('express');
// 🔁 use the same heuristic scanner used in index.js
const { computeLinkSafetyForUrl } = require('../scripts/safetyScanner');

const router = express.Router();

/**
 * POST /api/security/scan-url
 * Body: { url: "https://..." }
 * Returns: { score, verdict, reasons, flagRecommended, hostname }
 */
router.post('/scan-url', (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res
        .status(400)
        .json({ message: 'url is required for safety scan' });
    }

    // use the same logic as link creation
    const result = computeLinkSafetyForUrl(url);
    return res.json(result);
  } catch (err) {
    console.error('URL safety scan failed:', err);
    return res.status(500).json({ message: 'Failed to scan URL' });
  }
});

module.exports = router;
