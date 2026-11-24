const { SyncModel } = require('./base');

module.exports = new SyncModel({
  table: 'attachments',
  columns: {
    category: 'str',
    title: 'str',
    file_name: 'str',
    size_bytes: 'int',
    created_at: 'short',
  },
  fks: { student_id: 'students', application_id: 'applications', uploaded_by: 'users' },
  natural: [],
});
