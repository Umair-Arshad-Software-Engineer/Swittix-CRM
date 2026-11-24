// Offline sanity check of the models and the pull-cutoff logic (no MySQL).
const assert = require('assert');
const { models } = require('../src/models');

for (const m of models) {
  const sql = m.createTableSql();
  assert(sql.includes('uuid CHAR(32)'), m.table);
  for (const fk of Object.values(m.fkWire)) assert(sql.includes('`' + fk + '`'), fk);
}
const s = require('../src/models/students');
assert.deepStrictEqual(
  Object.keys(s.pick({ full_name: 'A', junk: 1 })).includes('junk'),
  false
);
assert.strictEqual(s.pick({}).full_name, null);
console.log(`ok: ${models.length} models`);
