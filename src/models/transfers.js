const { SyncModel } = require('./base');

module.exports = new SyncModel({
  table: 'transfers',
  columns: {
    amount: 'num',
    moved_on: 'short',
    note: 'text',
    created_at: 'short',
  },
  fks: { from_account_id: 'accounts', to_account_id: 'accounts', created_by: 'users' },
  natural: [],
});
