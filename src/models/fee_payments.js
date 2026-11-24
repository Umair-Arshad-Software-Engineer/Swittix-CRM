const { SyncModel } = require('./base');

module.exports = new SyncModel({
  table: 'fee_payments',
  columns: {
    amount: 'num',
    paid_on: 'short',
    method: 'str',
    reference: 'str',
    note: 'text',
    created_at: 'short',
  },
  fks: { student_id: 'students', received_by: 'users', account_id: 'accounts' },
  natural: [],
});
