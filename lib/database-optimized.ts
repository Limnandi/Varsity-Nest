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
  
  static async getFeaturedAccommodations(limit = 9) {
    const cacheKey = `${this.FEATURED_CACHE_KEY}:${limit}`
    
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
          .where(and(
            eq(schema.accommodations.isActive, true),
            eq(schema.accommodations.featured, true)
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
          amenities: acc.amenities || [],
          accreditation_status: 'accredited',
          provider_id: null,
          area: acc.area,
          distance: acc.distance,
          rating: acc.rating,
          review_count: acc.reviewCount,
          is_open: acc.isOpen,
          featured: acc.featured,
          available_rooms: acc.availableRooms,
          total_rooms: acc.totalRooms,
          is_verified: acc.isVerified
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
    const cacheKey = `${this.STATUS_CACHE_KEY}:${status}:${limit}:${offset}`
    
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
          .where(and(
            eq(schema.accommodations.isActive, true),
            eq(schema.accommodations.accreditationStatus, status as any)
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
          is_verified: acc.isVerified
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
  
  static async getAccommodationsByIds(ids: string[]) {
    if (ids.length === 0) return []
    
    const cacheKey = `accommodations:ids:${ids.sort().join(',')}`
    
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
      // Upstash Redis doesn't support keys() method
      // We'll need to track keys manually or use a different approach
      console.warn("Cache invalidation not fully supported in Upstash Redis")
    } catch (error) {
      console.error("Cache invalidation error:", error)
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
