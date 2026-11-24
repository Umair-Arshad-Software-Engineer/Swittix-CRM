const { SyncModel } = require('./base');

module.exports = new SyncModel({
  table: 'employees',
  columns: {
    full_name: 'str',
    job_title: 'str',
    phone: 'str',
    monthly_salary: 'num',
    standard_hours: 'num',
    overtime_rate: 'num',
    joined_on: 'short',
    is_active: 'int',
    note: 'text',
    created_at: 'short',
  },
  fks: { user_id: 'users' },
  natural: [],
});
