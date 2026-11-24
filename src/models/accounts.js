const { SyncModel } = require('./base');

module.exports = new SyncModel({
  table: 'accounts',
  columns: {
    name: 'str',
    kind: 'short',
    opening_balance: 'num',
    created_at: 'short',
  },
  fks: {},
  natural: ['name'],
});
