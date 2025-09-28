import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { log } from '@/lib/logging/logger';
import { captureException } from '@/lib/logging/config';

const runMigrations = async () => {
  const migrationClient = new Pool({
    connectionTimeoutMillis: 5000,
  });

  const db = drizzle(migrationClient);

  try {
    log.info('Starting database migrations');
    
    const startTime = performance.now();
    
    await migrate(db, {
      migrationsFolder: './database/migrations'
    });
    
    const duration = performance.now() - startTime;
    
    log.info('Database migrations completed successfully', {
      durationMs: duration
    });
    
  } catch (error) {
    log.error('Database migration failed', error instanceof Error ? error : new Error('Unknown error'));
    captureException(error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  } finally {
    await migrationClient.end();
  }
};

// Auto-migration in development, manual in production
if (process.env.NODE_ENV !== 'production') {
  runMigrations().catch((error) => {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  });
}
