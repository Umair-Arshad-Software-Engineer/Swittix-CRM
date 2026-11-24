const { SyncModel } = require('./base');

module.exports = new SyncModel({
  table: 'consultancy_fees',
  columns: {
    currency: 'short',
    total_amount: 'num',
    note: 'text',
    created_at: 'short',
    updated_at: 'short',
  },
  fks: { student_id: 'students', created_by: 'users' },
  natural: ['student_id'],
});
