const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const env = require('../config/env');

const UUID = /^[a-f0-9]{16,64}$/i;

function target(uuid) {
  if (!UUID.test(uuid)) return null;
  return path.resolve(env.uploadDir, uuid);
}

/** PUT /api/files/:uuid  (raw file bytes) */
exports.upload = async (req, res, next) => {
  try {
    const file = target(req.params.uuid);
    if (!file) return res.status(400).json({ error: 'Bad file id.' });
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'Empty file.' });
    }
    await fsp.mkdir(path.dirname(file), { recursive: true });
    await fsp.writeFile(file, req.body);
    res.json({ ok: true, bytes: req.body.length });
  } catch (e) {
    next(e);
  }
};

/** GET /api/files/:uuid */
exports.download = (req, res) => {
  const file = target(req.params.uuid);
  if (!file) return res.status(400).json({ error: 'Bad file id.' });
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'No such file.' });
  res.type('application/octet-stream').sendFile(file);
};
