const { pool } = require('./config/db');
const { models } = require('./models');

/** Creates any missing tables. Safe to run on every start. */
async function migrate() {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS sync_clock (id INT PRIMARY KEY, rev BIGINT NOT NULL)'
  );
  await pool.query('INSERT IGNORE INTO sync_clock (id, rev) VALUES (1, 0)');
  for (const m of models) await pool.query(m.createTableSql());
}

module.exports = { migrate };
