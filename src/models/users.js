const { SyncModel } = require('./base');

module.exports = new SyncModel({
  table: 'users',
  columns: {
    username: 'str',
    full_name: 'str',
    password_hash: 'str',
    salt: 'str',
    role: 'short',
    is_active: 'int',
    expires_at: 'short',
    last_login_at: 'short',
    created_at: 'short',
  },
  fks: {},
  natural: ['username'],
});
