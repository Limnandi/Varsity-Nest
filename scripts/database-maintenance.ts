#!/usr/bin/env node
import { optimizeDatabaseSchedule } from '../lib/database/optimization';
import { log } from '../lib/logging/logger';

async function runDatabaseMaintenance() {
  try {
    log.info('Starting scheduled database maintenance');
    
    // Run optimization routines
    await optimizeDatabaseSchedule();
    
    log.info('Database maintenance completed successfully');
    
  } catch (error) {
    log.error('Database maintenance failed', error instanceof Error ? error : new Error('Unknown error'));
    process.exit(1);
  }
}

// Run maintenance if called directly
if (require.main === module) {
  runDatabaseMaintenance();
}
