const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runDomainsMigration() {
  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Initialize Neon client
    const sql = neon(databaseUrl);

    console.log('🚀 Running whitelisted_domains table migration...');
    
    // Execute the migration statements individually
    console.log('Creating whitelisted_domains table...');
    await sql.query(`
      CREATE TABLE IF NOT EXISTS whitelisted_domains (
          id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          domain VARCHAR(255) NOT NULL UNIQUE,
          university VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
      )
    `);

    console.log('Inserting default domains...');
    await sql.query(`
      INSERT INTO whitelisted_domains (domain, university, is_active) VALUES
      ('@ufs4life.ac.za', 'UFS', true),
      ('@student.ufs.ac.za', 'UFS', true),
      ('@cut.ac.za', 'CUT', true),
      ('@student.cut.ac.za', 'CUT', true)
      ON CONFLICT (domain) DO NOTHING
    `);

    console.log('Creating trigger...');
    try {
      await sql.query(`
        CREATE TRIGGER update_whitelisted_domains_updated_at 
            BEFORE UPDATE ON whitelisted_domains 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column()
      `);
    } catch (error) {
      if (error.code !== '42710') { // Ignore "already exists" error
        throw error;
      }
      console.log('Trigger already exists, skipping...');
    }

    console.log('Creating indexes...');
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_whitelisted_domains_active ON whitelisted_domains(is_active)`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_whitelisted_domains_domain ON whitelisted_domains(domain)`);
    
    console.log('✅ Migration completed successfully!');

    // Verify the table exists
    const verification = await sql.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'whitelisted_domains'
    `);

    if (verification.length > 0) {
      console.log('✅ whitelisted_domains table verified to exist');
      
      // Check if default data was inserted
      const defaultData = await sql.query('SELECT * FROM whitelisted_domains ORDER BY created_at');
      console.log('📋 Default domains:', defaultData);
    } else {
      console.log('❌ whitelisted_domains table not found after migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runDomainsMigration();