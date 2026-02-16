const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Seed Script - Creates initial data for BhaMail
// Usage: npm run seed

async function seedDatabase() {
  console.log('🌱 Seeding BhaMail database...');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'bhamail',
    user: process.env.DB_USER || 'bhamail',
    password: process.env.DB_PASSWORD || 'bhamail123',
  });

  try {
    // Wait for database to be ready
    console.log('⏳ Waiting for database...');
    await pool.query('SELECT 1');

    console.log('👤 Creating admin user...');

    // Create admin user with password 'password'
    const passwordHash = await bcrypt.hash('password', 12);
    
    await pool.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, is_verified, is_admin, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'admin@bhamail.local',
        $1,
        'Admin',
        'User',
        true,
        true,
        NOW(),
        NOW()
      ) ON CONFLICT (email) DO NOTHING;
    `, [passwordHash]);

    // Get admin user ID
    const adminResult = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@bhamail.local']);
    const adminUserId = adminResult.rows[0].id;

    // Create system labels for admin user
    console.log('📁 Creating system labels...');
    const labels = [
      { name: 'inbox', color: '#1976d2' },
      { name: 'sent', color: '#388e3c' },
      { name: 'drafts', color: '#f57c00' },
      { name: 'trash', color: '#d32f2f' },
      { name: 'spam', color: '#e64a19' },
      { name: 'important', color: '#ffc107' },
      { name: 'starred', color: '#ff9800' }
    ];

    for (const label of labels) {
      await pool.query(`
        INSERT INTO labels (id, user_id, name, color, is_system, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())
        ON CONFLICT (user_id, name) DO NOTHING;
      `, [adminUserId, label.name, label.color]);
    }

    // Create sample DKIM key
    console.log('🔐 Creating DKIM keys...');
    await pool.query(`
      INSERT INTO dkim_keys (id, domain, selector, private_key, public_key, is_active, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'bhamail.local',
        'default',
        '-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdef...
-----END RSA PRIVATE KEY-----',
        '-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
-----END PUBLIC KEY-----',
        true,
        NOW(),
        NOW()
      ) ON CONFLICT (domain, selector) DO NOTHING;
    `);

    // Create mail settings
    console.log('⚙️ Creating mail settings...');
    const settings = [
      { key: 'smtp_host', value: 'mailhog', description: 'SMTP server hostname' },
      { key: 'smtp_port', value: '1025', description: 'SMTP server port' },
      { key: 'smtp_secure', value: 'false', description: 'Use SSL/TLS for SMTP' },
      { key: 'smtp_auth_user', value: '', description: 'SMTP authentication username' },
      { key: 'smtp_auth_pass', value: '', description: 'SMTP authentication password' },
      { key: 'imap_host', value: 'localhost', description: 'IMAP server hostname' },
      { key: 'imap_port', value: '143', description: 'IMAP server port' },
      { key: 'imap_secure', value: 'false', description: 'Use SSL/TLS for IMAP' },
      { key: 'max_attachment_size', value: '25000000', description: 'Maximum attachment size in bytes' },
      { key: 'storage_backend', value: 'minio', description: 'File storage backend (local|minio|s3)' },
      { key: 'enable_virus_scan', value: 'true', description: 'Enable virus scanning for attachments' },
      { key: 'default_quota', value: '5000000000', description: 'Default user quota in bytes (5GB)' }
    ];

    for (const setting of settings) {
      await pool.query(`
        INSERT INTO mail_settings (id, key, value, description, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
        ON CONFLICT (key) DO NOTHING;
      `, [setting.key, setting.value, setting.description]);
    }

    console.log('📧 Creating sample emails...');

    // Create welcome thread
    const threadResult = await pool.query(`
      INSERT INTO threads (id, subject, participants, last_message_at, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'Welcome to BhaMail! 🎉',
        ARRAY['admin@bhamail.local'],
        NOW(),
        NOW(),
        NOW()
      ) RETURNING id;
    `);
    const threadId = threadResult.rows[0].id;

    // Create welcome message
    const welcomeText = `Welcome to BhaMail, your self-hosted email solution!

Getting Started:
1. Check out the admin panel at /admin
2. Configure your domain settings
3. Set up DKIM keys for better deliverability
4. Invite team members
5. Customize your email experience

Features:
• Modern web interface with Gmail-like UX
• Mobile apps for iOS and Android
• Advanced search and filtering
• Attachment support with virus scanning
• Two-factor authentication
• API access for integrations

Need help? Check the documentation or contact support.

Happy emailing!
The BhaMail Team`;

    const welcomeHtml = `<html><body>
<h1>Welcome to BhaMail! 🎉</h1>
<p>Welcome to BhaMail, your self-hosted email solution!</p>

<h2>Getting Started:</h2>
<ol>
<li>Check out the admin panel at <a href="/admin">/admin</a></li>
<li>Configure your domain settings</li>
<li>Set up DKIM keys for better deliverability</li>
<li>Invite team members</li>
<li>Customize your email experience</li>
</ol>

<h2>Features:</h2>
<ul>
<li>Modern web interface with Gmail-like UX</li>
<li>Mobile apps for iOS and Android</li>
<li>Advanced search and filtering</li>
<li>Attachment support with virus scanning</li>
<li>Two-factor authentication</li>
<li>API access for integrations</li>
</ul>

<p>Need help? Check the documentation or contact support.</p>

<p>Happy emailing!<br>
<strong>The BhaMail Team</strong></p>
</body></html>`;

    const messageResult = await pool.query(`
      INSERT INTO messages (
        id, thread_id, from_email, from_name, to_emails, cc_emails, bcc_emails,
        subject, body_text, body_html, is_read, is_draft, sent_at, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'system@bhamail.local',
        'BhaMail System',
        ARRAY['admin@bhamail.local'],
        '{}',
        '{}',
        'Welcome to BhaMail! 🎉',
        $2,
        $3,
        false,
        false,
        NOW(),
        NOW(),
        NOW()
      ) RETURNING id;
    `, [threadId, welcomeText, welcomeHtml]);
    const messageId = messageResult.rows[0].id;

    // Get inbox label ID
    const inboxResult = await pool.query(
      'SELECT id FROM labels WHERE user_id = $1 AND name = $2',
      [adminUserId, 'inbox']
    );
    const inboxLabelId = inboxResult.rows[0].id;

    // Associate message with inbox label
    await pool.query(`
      INSERT INTO message_labels (message_id, label_id, created_at)
      VALUES ($1, $2, NOW());
    `, [messageId, inboxLabelId]);

    console.log('🔑 Creating admin API key...');

    // Create API key for admin user (hash of 'admin-dev-key-12345')
    const apiKeyHash = await bcrypt.hash('admin-dev-key-12345', 12);
    
    await pool.query(`
      INSERT INTO api_keys (id, user_id, name, key_hash, permissions, last_used_at, expires_at, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        $1,
        'Admin Development Key',
        $2,
        ARRAY['read', 'write', 'admin'],
        NULL,
        NOW() + INTERVAL '1 year',
        NOW(),
        NOW()
      );
    `, [adminUserId, apiKeyHash]);

    console.log('📊 Database statistics:');
    const stats = await pool.query(`
      SELECT 
        'Users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 
        'Labels', COUNT(*) FROM labels
      UNION ALL
      SELECT 
        'Messages', COUNT(*) FROM messages
      UNION ALL
      SELECT 
        'Threads', COUNT(*) FROM threads
      UNION ALL
      SELECT 
        'API Keys', COUNT(*) FROM api_keys
      UNION ALL
      SELECT 
        'DKIM Keys', COUNT(*) FROM dkim_keys
      UNION ALL
      SELECT 
        'Mail Settings', COUNT(*) FROM mail_settings;
    `);

    stats.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.count}`);
    });

    console.log('\n✅ Database seeded successfully!');
    console.log('\n👤 Admin Account Created:');
    console.log('   Email: admin@bhamail.local');
    console.log('   Password: password');
    console.log('   Role: Administrator');
    console.log('\n🔑 API Key Created:');
    console.log('   Name: Admin Development Key');
    console.log('   Key: admin-dev-key-12345');
    console.log('   Permissions: read, write, admin');
    console.log('   Expires: 1 year from now');
    console.log('\n📧 Sample Data:');
    console.log('   • Welcome message in inbox');
    console.log('   • System labels created');
    console.log('   • DKIM keys configured');
    console.log('   • Mail settings initialized');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Visit http://localhost:3000 to access the web app');
    console.log('   2. Login with admin@bhamail.local / password');
    console.log('   3. Check MailHog at http://localhost:8025 for email testing');
    console.log('   4. Access API docs at http://localhost:3001/api-docs');
    console.log('\n⚠️  Security Note:');
    console.log('   Change the default admin password in production!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };