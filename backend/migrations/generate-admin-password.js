// migrations/generate-admin-password.js
// Generate bcrypt hash for admin password

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10).then(hash => {
  console.log('\n=================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('=================================\n');
  console.log('Copy this hash and update the INSERT statement in supabase-schema.sql');
  console.log('Or run this SQL in Supabase SQL Editor:\n');
  console.log(`INSERT INTO admin_users (username, password_hash, full_name, role)`);
  console.log(`VALUES ('admin', '${hash}', 'System Administrator', 'admin')`);
  console.log(`ON CONFLICT (username) DO UPDATE SET password_hash = '${hash}';\n`);
});
