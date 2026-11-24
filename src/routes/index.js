const express = require('express');
const requireApiKey = require('../middleware/auth');
const sync = require('../controllers/syncController');
const files = require('../controllers/filesController');

const router = express.Router();

// Open: lets the app (or you) check the server is up.
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Everything under /api needs the API key.
const api = express.Router();
api.use(requireApiKey);
api.get('/ping', (req, res) => res.json({ ok: true }));
api.post('/sync/push', express.json({ limit: '5mb' }), sync.push);
api.get('/sync/pull', sync.pull);
api.put('/files/:uuid', express.raw({ type: '*/*', limit: '30mb' }), files.upload);
api.get('/files/:uuid', files.download);

router.use('/api', api);

module.exports = router;
