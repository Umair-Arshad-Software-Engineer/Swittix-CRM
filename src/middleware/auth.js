const crypto = require('crypto');
const env = require('../config/env');

/** Every /api request must carry the shared secret in `x-api-key`. */
module.exports = function requireApiKey(req, res, next) {
  const given = Buffer.from(String(req.get('x-api-key') || ''));
  const wanted = Buffer.from(env.apiKey);
  const ok =
    wanted.length > 0 &&
    given.length === wanted.length &&
    crypto.timingSafeEqual(given, wanted);
  if (!ok) return res.status(401).json({ error: 'Wrong or missing API key.' });
  next();
};
