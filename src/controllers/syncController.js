const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const { pool, withTransaction } = require('../config/db');
const { models, byTable } = require('../models');

const UUID = /^[a-f0-9]{16,64}$/i;
const MAX_PUSH = 500;

/** The next change number (unique, always growing). */
async function nextRev(conn) {
  await conn.query('UPDATE sync_clock SET rev = LAST_INSERT_ID(rev + 1) WHERE id = 1');
  const [[row]] = await conn.query('SELECT LAST_INSERT_ID() AS rev');
  return Number(row.rev);
}

/**
 * POST /api/sync/push
 * body: { records: [{ table, uuid, op: 'upsert' | 'delete', data }] }
 * Returns one result per record, in the same order.
 */
exports.push = async (req, res, next) => {
  try {
    const records = req.body && req.body.records;
    if (!Array.isArray(records) || records.length > MAX_PUSH) {
      return res.status(400).json({ error: `Send 1 to ${MAX_PUSH} records.` });
    }
    for (const r of records) {
      if (!r || !byTable[r.table]) {
        return res.status(400).json({ error: `Unknown table "${r && r.table}".` });
      }
      if (typeof r.uuid !== 'string' || !UUID.test(r.uuid)) {
        return res.status(400).json({ error: 'Bad record id.' });
      }
      if (r.op !== 'upsert' && r.op !== 'delete') {
        return res.status(400).json({ error: 'Bad operation.' });
      }
    }

    const results = await withTransaction(async (conn) => {
      const out = [];
      for (const r of records) {
        const rev = await nextRev(conn);
        out.push(await byTable[r.table].apply(conn, r, rev));
      }
      return out;
    });

    // A deleted attachment's file goes too.
    records.forEach((r) => {
      if (r.table === 'attachments' && r.op === 'delete') {
        fs.unlink(path.resolve(env.uploadDir, r.uuid), () => {});
      }
    });

    res.json({ results });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/sync/pull?since=<rev>&limit=<n>
 * Returns { changes: { table: [record] }, nextRev, hasMore }. Keep asking
 * with since = nextRev while hasMore is true.
 */
exports.pull = async (req, res, next) => {
  try {
    const since = Math.max(0, Number(req.query.since) || 0);
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 300));

    const perTable = [];
    let cutoff = Infinity;
    let hasMore = false;
    for (const m of models) {
      const rows = await m.changedSince(pool, since, limit);
      perTable.push([m, rows]);
      if (rows.length === limit) {
        hasMore = true;
        cutoff = Math.min(cutoff, Number(rows[rows.length - 1].rev));
      }
    }

    const changes = {};
    let maxRev = since;
    for (const [m, rows] of perTable) {
      const kept = rows.filter((r) => Number(r.rev) <= cutoff);
      if (!kept.length) continue;
      changes[m.table] = kept.map((r) => m.toWire(r));
      maxRev = Math.max(maxRev, Number(kept[kept.length - 1].rev));
    }
    res.json({ changes, nextRev: Number.isFinite(cutoff) ? cutoff : maxRev, hasMore });
  } catch (e) {
    next(e);
  }
};
