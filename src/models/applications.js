const { SyncModel } = require('./base');

module.exports = new SyncModel({
  table: 'applications',
  columns: {
    university: 'str',
    course: 'str',
    country: 'str',
    intake: 'str',
    reference: 'str',
    applied_date: 'short',
    status: 'str',
    currency: 'short',
    fee_amount: 'num',
    fee_paid: 'num',
    fee_paid_date: 'short',
    fee_note: 'text',
    notes: 'text',
    created_at: 'short',
    updated_at: 'short',
  },
  fks: { student_id: 'students' },
  natural: [],
});
