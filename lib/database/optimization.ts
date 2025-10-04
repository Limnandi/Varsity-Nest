import { sql } from 'drizzle-orm';
import { db } from './connection';
import { log } from '@/lib/logging/logger';
import { performanceMonitor } from '@/lib/monitoring/performance';

interface TableStats {
  tableName: string;
  totalRows: number;
  tableSize: string;
  indexSize: string;
  deadTuples: number;
}

export const getDatabaseStats = async (): Promise<TableStats[]> => {
  const endMetric = performanceMonitor.startMetric('get_database_stats');
  
  try {
    const result = await db.execute(sql`
      SELECT
        schemaname || '.' || relname as table_name,
        n_live_tup as total_rows,
        pg_size_pretty(pg_total_relation_size(relid)) as table_size,
        pg_size_pretty(pg_indexes_size(relid)) as index_size,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC;
    `);

    return result.rows as unknown as TableStats[];
  } finally {
    endMetric();
  }
};

export const optimizeTable = async (tableName: string): Promise<void> => {
  const endMetric = performanceMonitor.startMetric('optimize_table');
  
  try {
    // First, analyze the table
    await db.execute(sql`ANALYZE VERBOSE ${sql.raw(tableName)}`);
    
    // Then vacuum it
    await db.execute(sql`VACUUM ANALYZE ${sql.raw(tableName)}`);
    
    log.info(`Table ${tableName} has been optimized`);
  } catch (error) {
    log.error(`Failed to optimize table ${tableName}`, error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  } finally {
    endMetric();
  }
};

export const createIndexIfNotExists = async (
  tableName: string,
  columnName: string,
  indexName: string
): Promise<void> => {
  const endMetric = performanceMonitor.startMetric('create_index');
  
  try {
    // Check if index exists
    const indexExists = await db.execute(sql`
      SELECT 1
      FROM pg_indexes
      WHERE tablename = ${tableName}
      AND indexname = ${indexName}
    `);

    if (!indexExists || !indexExists.rows || indexExists.rows.length === 0) {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS ${sql.raw(indexName)}
        ON ${sql.raw(tableName)} (${sql.raw(columnName)})
      `);
      
      log.info(`Created index ${indexName} on ${tableName}(${columnName})`);
    }
  } catch (error) {
    log.error(`Failed to create index ${indexName}`, error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  } finally {
    endMetric();
  }
};

export const optimizeDatabaseSchedule = async (): Promise<void> => {
  try {
    const stats = await getDatabaseStats();
    
    for (const table of stats) {
      // If more than 10% of tuples are dead, optimize the table
      if (table.deadTuples > table.totalRows * 0.1) {
        await optimizeTable(table.tableName);
      }
    }
    
    log.info('Database optimization schedule completed');
  } catch (error) {
    log.error('Failed to run database optimization schedule', error instanceof Error ? error : new Error('Unknown error'));
  }
};
