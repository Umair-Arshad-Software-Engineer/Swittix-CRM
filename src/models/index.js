/**
 * Every synced model, parents before children. The desktop app uses the
 * same order, so a record's parents always arrive before it does.
 */
const models = [
  require('./users'),
  require('./students'),
  require('./accounts'),
  require('./applications'),
  require('./consultancy_fees'),
  require('./fee_payments'),
  require('./attachments'),
  require('./expenses'),
  require('./transfers'),
  require('./employees'),
  require('./salaries'),
];

const byTable = Object.fromEntries(models.map((m) => [m.table, m]));

module.exports = { models, byTable };
