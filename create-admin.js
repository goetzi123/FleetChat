const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Create default admin user
async function createDefaultAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check if admin table exists and create if needed
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL UNIQUE,
        name varchar(255) NOT NULL,
        password_hash varchar(255) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        permissions jsonb NOT NULL DEFAULT '{"canManagePricing": true, "canViewReports": true, "canManageSystem": true}',
        last_login_at timestamp,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);

    // Create other admin tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pricing_tiers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        description text,
        price_per_driver decimal(10,2) NOT NULL,
        min_drivers integer NOT NULL DEFAULT 1,
        max_drivers integer,
        features jsonb NOT NULL DEFAULT '[]',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_analytics (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id varchar NOT NULL,
        date varchar(10) NOT NULL,
        active_drivers integer NOT NULL DEFAULT 0,
        total_messages integer NOT NULL DEFAULT 0,
        total_transports integer NOT NULL DEFAULT 0,
        total_documents integer NOT NULL DEFAULT 0,
        api_calls integer NOT NULL DEFAULT 0,
        created_at timestamp DEFAULT now(),
        UNIQUE(tenant_id, date)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key varchar(255) NOT NULL UNIQUE,
        value text NOT NULL,
        description text,
        updated_by varchar,
        updated_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id varchar NOT NULL,
        billing_period varchar(7) NOT NULL,
        active_drivers integer NOT NULL,
        price_per_driver decimal(10,2) NOT NULL,
        total_amount decimal(10,2) NOT NULL,
        stripe_invoice_id varchar,
        status varchar NOT NULL DEFAULT 'pending',
        paid_at timestamp,
        created_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        sid varchar PRIMARY KEY,
        sess jsonb NOT NULL,
        expire timestamp NOT NULL
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_admin_session_expire ON admin_sessions(expire);
    `);

    // Check if default admin exists
    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE email = $1',
      ['admin@fleet.chat']
    );

    if (existingAdmin.rows.length === 0) {
      // Create default admin
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash('FleetChat2025!', saltRounds);
      
      await pool.query(`
        INSERT INTO admins (email, name, password_hash, is_active, permissions)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'admin@fleet.chat',
        'Fleet.Chat Administrator',
        hashedPassword,
        true,
        JSON.stringify({
          canManagePricing: true,
          canViewReports: true,
          canManageSystem: true
        })
      ]);

      console.log('✓ Default admin user created');
      console.log('Email: admin@fleet.chat');
      console.log('Password: FleetChat2025!');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Create default pricing tiers
    const existingTiers = await pool.query('SELECT id FROM pricing_tiers LIMIT 1');
    
    if (existingTiers.rows.length === 0) {
      await pool.query(`
        INSERT INTO pricing_tiers (name, description, price_per_driver, min_drivers, max_drivers, features, is_active)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14),
        ($15, $16, $17, $18, $19, $20, $21)
      `, [
        'Starter', 'Perfect for small fleets getting started with FleetChat', 2.50, 1, 10, 
        JSON.stringify(['WhatsApp messaging', 'Basic document handling', 'Transport tracking']), true,
        'Professional', 'Ideal for growing fleets with advanced needs', 3.00, 5, 50,
        JSON.stringify(['All Starter features', 'Advanced analytics', 'Custom workflows', 'Priority support']), true,
        'Enterprise', 'Complete solution for large fleet operations', 4.00, 25, null,
        JSON.stringify(['All Professional features', 'Custom integrations', 'Dedicated support', 'SLA guarantees']), true
      ]);

      console.log('✓ Default pricing tiers created');
    }

  } catch (error) {
    console.error('Error setting up admin system:', error);
  } finally {
    await pool.end();
  }
}

createDefaultAdmin();