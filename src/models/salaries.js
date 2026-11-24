const { SyncModel } = require('./base');

module.exports = new SyncModel({
  table: 'salaries',
  columns: {
    month: 'short',
    base_salary: 'num',
    working_hours: 'num',
    overtime_hours: 'num',
    overtime_rate: 'num',
    allowances: 'num',
    deductions: 'num',
    note: 'text',
    status: 'short',
    paid_on: 'short',
    created_at: 'short',
    updated_at: 'short',
  },
  fks: { employee_id: 'employees', account_id: 'accounts', created_by: 'users' },
  natural: ['employee_id', 'month'],
});
