/**
 * A synced table. Every row has:
 *   uuid     the id shared by all devices (the app's local ids differ)
 *   rev      a number that grows with every change (devices pull "rev > x")
 *   deleted  rows are never removed, only flagged, so other devices learn
 *
 * Columns that point at another table are stored as `<name>_uuid`
 * (for example students.counsellor_id travels as counsellor_uuid).
 *
 * `natural` lists the columns that identify "the same thing" even when two
 * devices created it separately (e.g. the user name, the account name).
 * If one arrives under a different uuid, the existing server row wins.
 */
const TYPES = {
  str: 'VARCHAR(255)',
  short: 'VARCHAR(64)',
  text: 'TEXT',
  num: 'DOUBLE',
  int: 'BIGINT',
};

const q = (name) => '`' + name + '`';

class SyncModel {
  constructor({ table, columns, fks = {}, natural = [] }) {
    this.table = table;
    this.columns = columns; // { column: 'str' | 'num' | ... }
    this.fks = fks; // { student_id: 'students' }
    this.fkWire = Object.fromEntries(
      Object.keys(fks).map((c) => [c, c.replace(/_id$/, '_uuid')])
    );
    this.naturalKeys = natural.map((c) => this.fkWire[c] || c);
  }

  /** Every key a client may send in `data`. */
  get dataKeys() {
    return [...Object.keys(this.columns), ...Object.values(this.fkWire)];
  }

  createTableSql() {
    const cols = [
      ...Object.entries(this.columns).map(([c, t]) => `${q(c)} ${TYPES[t]} NULL`),
      ...Object.values(this.fkWire).map((c) => `${q(c)} CHAR(32) NULL`),
    ];
    const keys = this.naturalKeys
      .filter((k) => this.columns[k] !== 'text')
      .map((k) => `KEY ${q('nk_' + k)} (${q(k)})`);
    return `CREATE TABLE IF NOT EXISTS ${q(this.table)} (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(32) NOT NULL,
      rev BIGINT NOT NULL,
      deleted TINYINT NOT NULL DEFAULT 0,
      ${cols.join(',\n      ')},
      UNIQUE KEY uq_uuid (uuid),
      KEY idx_rev (rev)${keys.length ? ',\n      ' + keys.join(',\n      ') : ''}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
  }

  /** Only the known keys, missing ones as null. */
  pick(data) {
    const out = {};
    for (const k of this.dataKeys) {
      out[k] = data && data[k] !== undefined ? data[k] : null;
    }
    return out;
  }

  toWire(row) {
    const data = {};
    for (const k of this.dataKeys) data[k] = row[k];
    return { uuid: row.uuid, deleted: !!row.deleted, rev: Number(row.rev), data };
  }

  /**
   * Stores one pushed record. Returns { uuid, status: 'ok' } or, when the
   * same natural key already exists under another uuid,
   * { uuid, status: 'merged', canonical } and writes nothing.
   */
  async apply(conn, rec, rev) {
    const t = q(this.table);

    if (rec.op === 'delete') {
      await conn.query(`UPDATE ${t} SET deleted = 1, rev = ? WHERE uuid = ?`, [
        rev,
        rec.uuid,
      ]);
      return { uuid: rec.uuid, status: 'ok' };
    }

    const data = this.pick(rec.data);
    const keys = this.dataKeys;
    const [existing] = await conn.query(
      `SELECT id FROM ${t} WHERE uuid = ? LIMIT 1 FOR UPDATE`,
      [rec.uuid]
    );

    if (existing.length) {
      const set = keys.map((k) => `${q(k)} = ?`).join(', ');
      await conn.query(
        `UPDATE ${t} SET ${set}, deleted = 0, rev = ? WHERE uuid = ?`,
        [...keys.map((k) => data[k]), rev, rec.uuid]
      );
      return { uuid: rec.uuid, status: 'ok' };
    }

    if (this.naturalKeys.length) {
      const where = this.naturalKeys.map((k) => `${q(k)} <=> ?`).join(' AND ');
      const [dup] = await conn.query(
        `SELECT * FROM ${t} WHERE ${where} AND deleted = 0 LIMIT 1`,
        this.naturalKeys.map((k) => data[k])
      );
      if (dup.length) {
        return { uuid: rec.uuid, status: 'merged', canonical: this.toWire(dup[0]) };
      }
    }

    await conn.query(
      `INSERT INTO ${t} (uuid, rev, deleted, ${keys.map(q).join(', ')})
       VALUES (?, ?, 0, ${keys.map(() => '?').join(', ')})`,
      [rec.uuid, rev, ...keys.map((k) => data[k])]
    );
    return { uuid: rec.uuid, status: 'ok' };
  }

  /** Rows changed after [since], oldest first. */
  async changedSince(conn, since, limit) {
    const [rows] = await conn.query(
      `SELECT * FROM ${q(this.table)} WHERE rev > ? ORDER BY rev ASC LIMIT ?`,
      [since, limit]
    );
    return rows;
  }
}

module.exports = { SyncModel };
