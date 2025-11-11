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

// Connection pool monitoring
let poolStats = {
  totalConnections: 0,
  idleConnections: 0,
  waitingClients: 0,
  lastChecked: new Date()
};

// Update pool statistics
export function getPoolStats() {
  return {
    ...poolStats,
    activeConnections: poolStats.totalConnections - poolStats.idleConnections,
    poolSize: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

// Monitor pool health
export async function checkPoolHealth() {
  try {
    const stats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    poolStats = {
      totalConnections: stats.totalCount,
      idleConnections: stats.idleCount,
      waitingClients: stats.waitingCount,
      lastChecked: new Date()
    };

    // Log warning if pool is getting full
    const utilizationPercent = (stats.totalCount / 20) * 100;
    if (utilizationPercent > 80) {
      log.warn(`Database pool utilization high: ${utilizationPercent.toFixed(1)}% (${stats.totalCount}/20 connections)`);
    }

    // Log warning if clients are waiting
    if (stats.waitingCount > 0) {
      log.warn(`Database pool has ${stats.waitingCount} waiting clients - consider increasing pool size`);
    }

    return {
      healthy: stats.totalCount < 18 && stats.waitingCount === 0,
      ...stats,
      utilizationPercent: utilizationPercent.toFixed(1)
    };
  } catch (error) {
    log.error('Error checking pool health', error instanceof Error ? error : new Error(String(error)));
    return { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Connection management
pool.on('connect', () => {
  log.info('New database connection established');
  checkPoolHealth().catch(() => {}); // Update stats, ignore errors
});

pool.on('error', (err) => {
  log.error('Database pool error', err);
});

// Periodic pool health monitoring (every 5 minutes)
if (typeof process !== 'undefined') {
  setInterval(async () => {
    try {
      await checkPoolHealth();
    } catch (error) {
      // Silently fail - don't crash the app if monitoring fails
      log.warn('Pool health check failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }, 5 * 60 * 1000); // 5 minutes
}

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
