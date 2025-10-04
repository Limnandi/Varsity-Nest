import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { redis } from '@/lib/redis';
import { monitorDatabaseQuery } from '@/lib/monitoring/database';
import { log } from '@/lib/logging/logger';

// Initialize connection pool with optimal settings
const pool = new Pool({
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close connections after 7500 queries (prevent memory leaks)
});

// Initialize drizzle with the connection pool
export const db = drizzle(pool, {
  logger: true
});

// Cache configuration
const DEFAULT_CACHE_TTL = 300; // 5 minutes
const CACHE_ENABLED = process.env.NODE_ENV === 'production';

// Generic cache wrapper for database queries
export async function withCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<T> {
  if (!CACHE_ENABLED) {
    return queryFn();
  }

  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached as string) as T;
    } catch (e) {
      // If parsing fails, ignore and continue to fetch fresh data
    }
  }

  const result = await queryFn();
  try {
    await redis.set(key, JSON.stringify(result), { ex: ttl });
  } catch (e) {
    // If Redis set fails, log and continue
    // eslint-disable-next-line no-console
    console.warn('Redis set failed', e);
  }
  return result;
}

// Query builder with performance monitoring
export const createQueryBuilder = <T>(queryName: string, baseQuery: () => Promise<T>) => {
  const monitoredQuery = monitorDatabaseQuery(queryName, baseQuery);

  return {
    // Execute with cache
    withCache: async (cacheKey: string, ttl?: number) => {
      return withCache(cacheKey, monitoredQuery, ttl);
    },

    // Execute without cache
    execute: monitoredQuery,

    // Stream results for large datasets
    async *stream(batchSize = 1000) {
      let offset = 0;
      while (true) {
        const batch = await monitoredQuery({ limit: batchSize, offset });
        if (Array.isArray(batch) && batch.length === 0) break;
        yield batch;
        offset += batchSize;
      }
    }
  };
};

// Connection management
pool.on('connect', () => {
  log.info('New database connection established');
});

pool.on('error', (err) => {
  log.error('Database pool error', err);
});

// Cleanup on application shutdown
process.on('SIGINT', async () => {
  try {
    await pool.end();
    log.info('Database pool has been closed');
  } catch (error) {
    log.error('Error closing database pool', error instanceof Error ? error : new Error('Unknown error'));
  }
  process.exit(0);
});
