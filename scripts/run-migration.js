const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Initialize Neon client
    const sql = neon(databaseUrl);

    console.log('🚀 Running admin_settings table migration...');
    
    // Execute the migration statements individually
    console.log('Creating admin_settings table...');
    await sql.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          maintenance_mode BOOLEAN DEFAULT false,
          registration_enabled BOOLEAN DEFAULT true,
          payments_enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT single_row CHECK (id = 1)
      )
    `);

    console.log('Inserting default admin settings...');
    await sql.query(`
      INSERT INTO admin_settings (id, maintenance_mode, registration_enabled, payments_enabled)
      VALUES (1, false, true, true)
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('Creating trigger...');
    try {
      await sql.query(`
        CREATE TRIGGER update_admin_settings_updated_at
            BEFORE UPDATE ON admin_settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
      `);
    } catch (error) {
      if (error.code !== '42710') { // Ignore "already exists" error
        throw error;
      }
      console.log('Trigger already exists, skipping...');
    }
    
    console.log('✅ Migration completed successfully!');

    // Verify the table exists
    const verification = await sql.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'admin_settings'
    `);

    if (verification.length > 0) {
      console.log('✅ admin_settings table verified to exist');
      
      // Check if default data was inserted
      const defaultData = await sql.query('SELECT * FROM admin_settings WHERE id = 1');
      console.log('📋 Default settings:', defaultData[0]);
    } else {
      console.log('❌ admin_settings table not found after migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();