const { SyncModel } = require('./base');

module.exports = new SyncModel({
  table: 'expenses',
  columns: {
    title: 'str',
    category: 'str',
    amount: 'num',
    spent_on: 'short',
    payee: 'str',
    reference: 'str',
    note: 'text',
    created_at: 'short',
  },
  fks: { account_id: 'accounts', created_by: 'users' },
  natural: [],
});
