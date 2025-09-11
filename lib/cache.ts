import { redis } from "./redis"

export class CacheManager {
  private static readonly DEFAULT_TTL = 300 // 5 minutes
  private static readonly LONG_TTL = 3600 // 1 hour
  private static readonly SHORT_TTL = 60 // 1 minute

  // Generic cache operations
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      return cached ? JSON.parse(cached as string) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  static async set<T>(key: string, value: T, ttl = this.DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  static async delPattern(pattern: string): Promise<void> {
    try {
      // Upstash Redis doesn't support keys() method
      // We'll need to track keys manually or use a different approach
      console.warn(`Pattern deletion not supported in Upstash Redis: ${pattern}`)
      // Alternative: Use a set to track keys with patterns
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error)
    }
  }

  // Cache key generators
  static getAccommodationKey(id: string): string {
    return `accommodation:${id}`
  }

  static getAccommodationsByStatusKey(status: string, limit: number, offset: number): string {
    return `accommodations:status:${status}:${limit}:${offset}`
  }

  static getFeaturedAccommodationsKey(limit: number): string {
    return `accommodations:featured:${limit}`
  }

  static getUserKey(id: string): string {
    return `user:${id}`
  }

  static getProviderKey(id: string): string {
    return `provider:${id}`
  }

  static getSearchKey(query: string, filters: Record<string, any>): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|')
    return `search:${query}:${filterString}`
  }

  // Specific cache operations
  static async cacheAccommodation(accommodation: any, ttl = this.DEFAULT_TTL): Promise<void> {
    const key = this.getAccommodationKey(accommodation.id)
    await this.set(key, accommodation, ttl)
  }

  static async getCachedAccommodation(id: string): Promise<any | null> {
    const key = this.getAccommodationKey(id)
    return await this.get(key)
  }

  static async cacheAccommodationsByStatus(
    status: string,
    limit: number,
    offset: number,
    accommodations: any[],
    ttl = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.getAccommodationsByStatusKey(status, limit, offset)
    await this.set(key, accommodations, ttl)
  }

  static async getCachedAccommodationsByStatus(
    status: string,
    limit: number,
    offset: number
  ): Promise<any[] | null> {
    const key = this.getAccommodationsByStatusKey(status, limit, offset)
    return await this.get(key)
  }

  static async cacheFeaturedAccommodations(
    limit: number,
    accommodations: any[],
    ttl = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.getFeaturedAccommodationsKey(limit)
    await this.set(key, accommodations, ttl)
  }

  static async getCachedFeaturedAccommodations(limit: number): Promise<any[] | null> {
    const key = this.getFeaturedAccommodationsKey(limit)
    return await this.get(key)
  }

  static async cacheSearchResults(
    query: string,
    filters: Record<string, any>,
    results: any[],
    ttl = this.SHORT_TTL
  ): Promise<void> {
    const key = this.getSearchKey(query, filters)
    await this.set(key, results, ttl)
  }

  static async getCachedSearchResults(
    query: string,
    filters: Record<string, any>
  ): Promise<any[] | null> {
    const key = this.getSearchKey(query, filters)
    return await this.get(key)
  }

  // Cache invalidation
  static async invalidateAccommodation(id: string): Promise<void> {
    await this.del(this.getAccommodationKey(id))
    await this.delPattern('accommodations:*')
  }

  static async invalidateUser(id: string): Promise<void> {
    await this.del(this.getUserKey(id))
  }

  static async invalidateProvider(id: string): Promise<void> {
    await this.del(this.getProviderKey(id))
    await this.delPattern('accommodations:*')
  }

  static async invalidateAllAccommodations(): Promise<void> {
    await this.delPattern('accommodation:*')
    await this.delPattern('accommodations:*')
    await this.delPattern('search:*')
  }

  // Cache warming
  static async warmAccommodationCache(accommodationIds: string[]): Promise<void> {
    const { OptimizedAccommodationRepository } = await import('./database-optimized')
    
    for (const id of accommodationIds) {
      const cached = await this.getCachedAccommodation(id)
      if (!cached) {
        // This would need to be implemented based on your data fetching logic
        console.log(`Warming cache for accommodation ${id}`)
      }
    }
  }

  // Cache statistics
  static async getCacheStats(): Promise<{
    totalKeys: number
    memoryUsage: string
    hitRate: number
  }> {
    try {
      // Upstash Redis doesn't support info() or keys() methods
      // We'll implement a basic stats tracking system
      return {
        totalKeys: 0, // Would need to implement key counting
        memoryUsage: 'N/A', // Not available in Upstash Redis
        hitRate: 0 // Would need to implement hit/miss tracking
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return {
        totalKeys: 0,
        memoryUsage: 'Unknown',
        hitRate: 0
      }
    }
  }

  // Cache cleanup
  static async cleanupExpiredKeys(): Promise<void> {
    try {
      // Redis automatically handles TTL, but we can add custom cleanup logic here
      console.log('Cache cleanup completed')
    } catch (error) {
      console.error('Cache cleanup error:', error)
    }
  }
}

// Cache decorator for functions
export function cached(ttl = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`
      
      // Try cache first
      const cached = await CacheManager.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Execute method and cache result
      const result = await method.apply(this, args)
      await CacheManager.set(cacheKey, result, ttl)
      
      return result
    }
  }
}
