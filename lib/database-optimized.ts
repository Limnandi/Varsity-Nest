import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { Pool } from "pg"
import * as schema from "./schema"
import { env } from "@/lib/env"
import { eq, and, desc, count, sql, inArray } from "drizzle-orm"
import { redis } from "./redis"

// Ensure this module only runs on the server
if (typeof window !== 'undefined') {
  throw new Error('This module can only be used on the server side')
}

// Connection pool configuration
const poolConfig = {
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

let _pool: Pool | null = null
let _sql: any = null
let _db: any = null

function getDatabaseUrl(): string {
  return env.DATABASE_URL
}

// Optimized connection pool
export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: getDatabaseUrl(),
      ...poolConfig,
    })
  }
  return _pool
}

// Optimized SQL connection
export function getSQL() {
  if (!_sql) {
    _sql = neon(getDatabaseUrl(), {
      arrayMode: false,
      fullResults: false,
    })
  }
  return _sql
}

// Optimized Drizzle instance
export function getDB() {
  if (!_db) {
    _db = drizzle(getSQL(), { schema })
  }
  return _db
}

// Query performance monitoring
export class QueryMonitor {
  private static queryTimes = new Map<string, number[]>()
  
  static async executeWithMonitoring<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    
    try {
      const result = await queryFn()
      const duration = performance.now() - start
      
      this.recordQueryTime(queryName, duration)
      
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }
  
  private static recordQueryTime(queryName: string, duration: number) {
    if (!this.queryTimes.has(queryName)) {
      this.queryTimes.set(queryName, [])
    }
    
    const times = this.queryTimes.get(queryName)!
    times.push(duration)
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift()
    }
  }
  
  static getQueryStats(queryName: string) {
    const times = this.queryTimes.get(queryName) || []
    if (times.length === 0) return null
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const max = Math.max(...times)
    const min = Math.min(...times)
    
    return { avg, max, min, count: times.length }
  }
}

// Optimized accommodation repository with caching
export class OptimizedAccommodationRepository {
  private static readonly CACHE_TTL = 300 // 5 minutes
  private static readonly FEATURED_CACHE_KEY = "accommodations:featured"
  private static readonly STATUS_CACHE_KEY = "accommodations:status"
  private static readonly CACHE_VERSION_KEY = "accommodations:cache:version"

  private static async getCacheVersion() {
    try {
      const existing = await redis.get(this.CACHE_VERSION_KEY)
      if (existing) {
        const parsed = Number(existing)
        if (!Number.isNaN(parsed) && parsed > 0) {
          return parsed
        }
      }
      await redis.set(this.CACHE_VERSION_KEY, "1")
    } catch (error) {
      console.warn("Failed to read cache version, resetting:", error)
      try {
        await redis.set(this.CACHE_VERSION_KEY, "1")
      } catch {}
    }
    return 1
  }
  
  static async getFeaturedAccommodations(limit = 9) {
    const cacheVersion = await this.getCacheVersion()
    const cacheKey = `${this.FEATURED_CACHE_KEY}:v${cacheVersion}:${limit}`
    
    // Try cache first
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        // Handle case where cache is corrupted
        if (typeof cached === 'string') {
          return JSON.parse(cached)
        } else {
          // Corrupted cache entry, delete it
          console.warn(`[CACHE] Corrupted cache entry for ${cacheKey}, deleting...`)
          await redis.del(cacheKey)
        }
      }
    } catch (error) {
      console.warn(`[CACHE] Cache get error for ${cacheKey}:`, error)
      // Delete corrupted cache entry
      try {
        await redis.del(cacheKey)
      } catch (delError) {
        console.warn(`[CACHE] Failed to delete corrupted cache key ${cacheKey}`)
      }
    }
    
    const result = await QueryMonitor.executeWithMonitoring(
      "getFeaturedAccommodations",
      async () => {
        const accommodations = await getDB()
          .select({
            id: schema.accommodations.id,
            name: schema.accommodations.name,
            address: schema.accommodations.address,
            price: schema.accommodations.price,
            images: schema.accommodations.images,
            featured: schema.accommodations.featured,
          })
          .from(schema.accommodations)
          .where(and(
            eq(schema.accommodations.isActive, true),
            eq(schema.accommodations.featured, true),
            sql`accommodations.is_published = true`
          ))
          .orderBy(desc(schema.accommodations.createdAt))
          .limit(limit)
        
        return accommodations.map((acc: any) => ({
          id: acc.id,
          name: acc.name,
          description: acc.description,
          address: acc.address,
          price: acc.price,
          images: acc.images || [],
          amenities: [],
          accreditation_status: 'accredited',
          provider_id: null,
          area: undefined,
          distance: undefined,
          rating: undefined,
          review_count: undefined,
          is_open: undefined,
          featured: acc.featured,
          available_rooms: undefined,
          total_rooms: undefined,
          is_verified: undefined
        }))
      }
    )
    
    // Cache result
    try {
      const serializedResult = JSON.stringify(result, (_, value) => {
        // Handle special cases for JSON serialization
        if (value instanceof Date) {
          return value.toISOString()
        }
        if (typeof value === 'bigint') {
          return value.toString()
        }
        return value
      })
      await redis.set(cacheKey, serializedResult, { ex: this.CACHE_TTL })
    } catch (error) {
      console.warn(`Cache set error for ${cacheKey}:`, error)
    }
    
    return result
  }
  
  static async getAccommodationsByStatus(
    status: string, 
    limit = 200, 
    offset = 0
  ) {
    const cacheVersion = await this.getCacheVersion()
    const cacheKey = `${this.STATUS_CACHE_KEY}:v${cacheVersion}:${status}:${limit}:${offset}`
    
    // Try cache first
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        // Handle case where cache is corrupted
        if (typeof cached === 'string') {
          return JSON.parse(cached)
        } else {
          // Corrupted cache entry, delete it
          console.warn(`[CACHE] Corrupted cache entry for ${cacheKey}, deleting...`)
          await redis.del(cacheKey)
        }
      }
    } catch (error) {
      console.warn(`[CACHE] Cache get error for ${cacheKey}:`, error)
      // Delete corrupted cache entry
      try {
        await redis.del(cacheKey)
      } catch (delError) {
        console.warn(`[CACHE] Failed to delete corrupted cache key ${cacheKey}`)
      }
    }
    
    const result = await QueryMonitor.executeWithMonitoring(
      "getAccommodationsByStatus",
      async () => {
        const accommodations = await getDB()
          .select({
            id: schema.accommodations.id,
            name: schema.accommodations.name,
            address: schema.accommodations.address,
            price: schema.accommodations.price,
            images: schema.accommodations.images,
            accreditationStatus: schema.accommodations.accreditationStatus,
          })
          .from(schema.accommodations)
          .where(and(
            eq(schema.accommodations.isActive, true),
            eq(schema.accommodations.accreditationStatus, status as any),
            sql`accommodations.is_published = true`
          ))
          .orderBy(desc(schema.accommodations.createdAt))
          .limit(limit)
          .offset(offset)
        
        return accommodations.map((acc: any) => ({
          id: acc.id,
          name: acc.name,
          description: acc.description,
          address: acc.address,
          price: acc.price,
          images: acc.images || [],
          amenities: [],
          accreditation_status: acc.accreditationStatus,
          provider_id: null,
          area: undefined,
          distance: undefined,
          rating: undefined,
          review_count: undefined,
          is_open: undefined,
          featured: undefined,
          available_rooms: undefined,
          total_rooms: undefined,
          is_verified: undefined
        }))
      }
    )
    
    // Cache result
    try {
      const serializedResult = JSON.stringify(result, (_, value) => {
        // Handle special cases for JSON serialization
        if (value instanceof Date) {
          return value.toISOString()
        }
        if (typeof value === 'bigint') {
          return value.toString()
        }
        return value
      })
      await redis.set(cacheKey, serializedResult, { ex: this.CACHE_TTL })
    } catch (error) {
      console.warn(`Cache set error for ${cacheKey}:`, error)
    }
    
    return result
  }

  static async getActiveAccommodations(limit = 200, offset = 0) {
    const cacheVersion = await this.getCacheVersion()
    const cacheKey = `accommodations:active:v${cacheVersion}:${limit}:${offset}`
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        if (typeof cached === 'string') return JSON.parse(cached)
        await redis.del(cacheKey)
      }
    } catch (e) {
      try { await redis.del(cacheKey) } catch {}
    }

    const result = await QueryMonitor.executeWithMonitoring(
      "getActiveAccommodations",
      async () => {
        const accommodations = await getDB()
          .select({
            id: schema.accommodations.id,
            name: schema.accommodations.name,
            address: schema.accommodations.address,
            price: schema.accommodations.price,
            images: schema.accommodations.images,
            accreditationStatus: schema.accommodations.accreditationStatus,
          })
          .from(schema.accommodations)
          .where(eq(schema.accommodations.isActive, true))
          .orderBy(desc(schema.accommodations.createdAt))
          .limit(limit)
          .offset(offset)

        return accommodations.map((acc: any) => ({
          id: acc.id,
          name: acc.name,
          address: acc.address,
          price: acc.price,
          images: acc.images || [],
          amenities: [],
          accreditation_status: acc.accreditationStatus,
          provider_id: null,
          area: undefined,
          distance: undefined,
          rating: undefined,
          review_count: undefined,
          is_open: undefined,
          featured: undefined,
          available_rooms: undefined,
          total_rooms: undefined,
          is_verified: undefined,
        }))
      }
    )

    try {
      await redis.set(cacheKey, JSON.stringify(result), { ex: this.CACHE_TTL })
    } catch {}

    return result
  }

  static async getPublishedAccommodations(limit = 200, offset = 0) {
    const cacheVersion = await this.getCacheVersion()
    const cacheKey = `accommodations:published:v${cacheVersion}:${limit}:${offset}`
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        if (typeof cached === 'string') return JSON.parse(cached)
        await redis.del(cacheKey)
      }
    } catch (_) {
      try { await redis.del(cacheKey) } catch {}
    }

    const result = await QueryMonitor.executeWithMonitoring(
      "getPublishedAccommodations",
      async () => {
        const accommodations = await getDB()
          .select({
            id: schema.accommodations.id,
            name: schema.accommodations.name,
            description: schema.accommodations.description,
            address: schema.accommodations.address,
            price: schema.accommodations.price,
            images: schema.accommodations.images,
            amenities: schema.accommodations.amenities,
            area: schema.accommodations.area,
            distance: schema.accommodations.distance,
            rating: schema.accommodations.rating,
            reviewCount: schema.accommodations.reviewCount,
            isOpen: schema.accommodations.isOpen,
            featured: schema.accommodations.featured,
            availableRooms: schema.accommodations.availableRooms,
            totalRooms: schema.accommodations.totalRooms,
            isVerified: schema.accommodations.isVerified,
            accreditationStatus: schema.accommodations.accreditationStatus,
          })
          .from(schema.accommodations)
          .where(
            sql`accommodations.is_published = true`
          )
          .orderBy(desc(schema.accommodations.createdAt))
          .limit(limit)
          .offset(offset)

        return accommodations.map((acc: any) => ({
          id: acc.id,
          name: acc.name,
          description: acc.description,
          address: acc.address,
          price: acc.price,
          images: acc.images || [],
          amenities: acc.amenities || [],
          accreditation_status: acc.accreditationStatus,
          provider_id: null,
          area: acc.area,
          distance: acc.distance,
          rating: acc.rating,
          review_count: acc.reviewCount,
          is_open: acc.isOpen,
          featured: acc.featured,
          available_rooms: acc.availableRooms,
          total_rooms: acc.totalRooms,
          is_verified: acc.isVerified,
        }))
      }
    )

    try { await redis.set(cacheKey, JSON.stringify(result), { ex: this.CACHE_TTL }) } catch {}
    return result
  }
  
  static async getAccommodationsByIds(ids: string[]) {
    if (ids.length === 0) return []
    
    const cacheVersion = await this.getCacheVersion()
    const cacheKey = `accommodations:ids:v${cacheVersion}:${ids.sort().join(',')}`
    
    // Try cache first
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        // Handle case where cache is corrupted
        if (typeof cached === 'string') {
          return JSON.parse(cached)
        } else {
          // Corrupted cache entry, delete it
          console.warn(`[CACHE] Corrupted cache entry for ${cacheKey}, deleting...`)
          await redis.del(cacheKey)
        }
      }
    } catch (error) {
      console.warn(`[CACHE] Cache get error for ${cacheKey}:`, error)
      // Delete corrupted cache entry
      try {
        await redis.del(cacheKey)
      } catch (delError) {
        console.warn(`[CACHE] Failed to delete corrupted cache key ${cacheKey}`)
      }
    }
    
    const result = await QueryMonitor.executeWithMonitoring(
      "getAccommodationsByIds",
      async () => {
        const accommodations = await getDB()
          .select()
          .from(schema.accommodations)
          .where(inArray(schema.accommodations.id, ids))
        
        return accommodations
      }
    )
    
    // Cache result
    try {
      const serializedResult = JSON.stringify(result, (_, value) => {
        // Handle special cases for JSON serialization
        if (value instanceof Date) {
          return value.toISOString()
        }
        if (typeof value === 'bigint') {
          return value.toString()
        }
        return value
      })
      await redis.set(cacheKey, serializedResult, { ex: this.CACHE_TTL })
    } catch (error) {
      console.warn(`Cache set error for ${cacheKey}:`, error)
    }
    
    return result
  }
  
  static async invalidateCache() {
    try {
      await redis.incr(this.CACHE_VERSION_KEY)
    } catch (error) {
      console.warn("Cache version increment failed:", error)
      try {
        await redis.set(this.CACHE_VERSION_KEY, `${Date.now()}`)
      } catch (innerError) {
        console.error("Cache invalidation error:", innerError)
      }
    }
  }
}

// Batch operations for N+1 query prevention
export class BatchOperations {
  static async getAccommodationsWithProviders(accommodationIds: string[]) {
    if (accommodationIds.length === 0) return []
    
    return await QueryMonitor.executeWithMonitoring(
      "getAccommodationsWithProviders",
      async () => {
        const result = await getDB()
          .select({
            id: schema.accommodations.id,
            name: schema.accommodations.name,
            description: schema.accommodations.description,
            address: schema.accommodations.address,
            price: schema.accommodations.price,
            images: schema.accommodations.images,
            amenities: schema.accommodations.amenities,
            providerId: schema.accommodations.providerId,
            providerName: schema.providers.businessName,
            providerEmail: schema.providers.contactEmail,
            providerPhone: schema.providers.contactPhone,
          })
          .from(schema.accommodations)
          .leftJoin(schema.providers, eq(schema.accommodations.providerId, schema.providers.id))
          .where(inArray(schema.accommodations.id, accommodationIds))
        
        return result
      }
    )
  }
  
  static async getAccommodationStats(accommodationIds: string[]) {
    if (accommodationIds.length === 0) return []
    
    return await QueryMonitor.executeWithMonitoring(
      "getAccommodationStats",
      async () => {
        const result = await getDB()
          .select({
            accommodationId: schema.reviews.accommodationId,
            avgRating: sql<number>`AVG(${schema.reviews.rating})`,
            reviewCount: count(schema.reviews.id),
          })
          .from(schema.reviews)
          .where(inArray(schema.reviews.accommodationId, accommodationIds))
          .groupBy(schema.reviews.accommodationId)
        
        return result
      }
    )
  }
}

// Database health monitoring
export class DatabaseHealth {
  static async checkConnection() {
    try {
      const start = performance.now()
      await getSQL()`SELECT 1`
      const duration = performance.now() - start
      
      return {
        status: 'healthy',
        responseTime: duration,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }
  
  static async getPerformanceMetrics() {
    const metrics = new Map()
    
    for (const [queryName] of (QueryMonitor as any).queryTimes) {
      const stats = QueryMonitor.getQueryStats(queryName)
      if (stats) {
        metrics.set(queryName, stats)
      }
    }
    
    return Object.fromEntries(metrics)
  }
}
