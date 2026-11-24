const express = require('express');
const env = require('./config/env');
const routes = require('./routes');
const { migrate } = require('./migrate');

async function main() {
  if (!env.apiKey || env.apiKey.startsWith('change-me')) {
    console.warn('WARNING: set a long random API_KEY in .env before going live.');
  }
  await migrate();

  const app = express();
  app.disable('x-powered-by');
  app.use(routes);
  app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  });

  app.listen(env.port, () =>
    console.log(`Swittix sync server running on port ${env.port}`)
  );
}

main().catch((e) => {
  console.error('Could not start:', e.message);
  process.exit(1);
});
