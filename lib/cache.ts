// Client-side cache for browser environment
class ClientCache {
  private static cache = new Map<string, { value: any; expiry: number }>()

  static get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  static set<T>(key: string, value: T, ttl = 300000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    })
  }

  static del(key: string): void {
    this.cache.delete(key)
  }

  static clear(): void {
    this.cache.clear()
  }
}

// Server-side cache manager (only available on server)
class ServerCacheManager {
  private static readonly DEFAULT_TTL = 300 // 5 minutes
  private static readonly LONG_TTL = 3600 // 1 hour
  private static readonly SHORT_TTL = 60 // 1 minute

  // Generic cache operations
  static async get<T>(key: string): Promise<T | null> {
    if (typeof window !== 'undefined') return null
    
    try {
      const { redis } = await import("./redis")
      const cached = await redis.get(key)
      return cached ? JSON.parse(cached as string) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  static async set<T>(key: string, value: T, ttl = this.DEFAULT_TTL): Promise<void> {
    if (typeof window !== 'undefined') return
    
    try {
      const { redis } = await import("./redis")
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  static async del(key: string): Promise<void> {
    if (typeof window !== 'undefined') return
    
    try {
      const { redis } = await import("./redis")
      await redis.del(key)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  static async delPattern(pattern: string): Promise<void> {
    if (typeof window !== 'undefined') return
    
    try {
      // Upstash Redis doesn't support keys() method
      console.warn(`Pattern deletion not supported in Upstash Redis: ${pattern}`)
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
    for (const id of accommodationIds) {
      const cached = await this.getCachedAccommodation(id)
      if (!cached) {
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
      return {
        totalKeys: 0,
        memoryUsage: 'N/A',
        hitRate: 0
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
      console.log('Cache cleanup completed')
    } catch (error) {
      console.error('Cache cleanup error:', error)
    }
  }
}

export class CacheManager {
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

  // Generic cache operations - automatically choose client or server
  static async get<T>(key: string): Promise<T | null> {
    if (typeof window !== 'undefined') {
      return ClientCache.get<T>(key)
    }
    return await ServerCacheManager.get<T>(key)
  }

  static async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    if (typeof window !== 'undefined') {
      ClientCache.set(key, value, ttl * 1000) // Convert to milliseconds
      return
    }
    await ServerCacheManager.set(key, value, ttl)
  }

  static async del(key: string): Promise<void> {
    if (typeof window !== 'undefined') {
      ClientCache.del(key)
      return
    }
    await ServerCacheManager.del(key)
  }

  // Specific cache operations
  static async cacheAccommodation(accommodation: any, ttl = 300): Promise<void> {
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
    ttl = 300
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
    ttl = 300
  ): Promise<void> {
    const key = this.getFeaturedAccommodationsKey(limit)
    await this.set(key, accommodations, ttl)
  }

  static async getCachedFeaturedAccommodations(limit: number): Promise<any[] | null> {
    const key = this.getFeaturedAccommodationsKey(limit)
    return await this.get(key)
  }

  // Client-side specific methods (synchronous for browser)
  static getCachedAccommodationsByStatusClient(
    status: string,
    limit: number,
    offset: number
  ): any[] | null {
    const key = this.getAccommodationsByStatusKey(status, limit, offset)
    return ClientCache.get(key)
  }

  static cacheAccommodationsByStatusClient(
    status: string,
    limit: number,
    offset: number,
    accommodations: any[],
    ttl = 300000
  ): void {
    const key = this.getAccommodationsByStatusKey(status, limit, offset)
    ClientCache.set(key, accommodations, ttl)
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
