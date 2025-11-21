"use client"

interface Resolver {
  resolve: (value: boolean) => void
  reject: (reason?: unknown) => void
}

const CACHE_TTL = 60 * 1000 // 1 minute
const cache = new Map<string, { value: boolean; timestamp: number }>()
const queue = new Map<string, Resolver[]>()
let flushHandle: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (flushHandle) return
  flushHandle = setTimeout(async () => {
    flushHandle = null
    const batch = Array.from(queue.keys())
    if (batch.length === 0) {
      return
    }

    const resolvers = new Map(queue)
    queue.clear()

    try {
      const response = await fetch(`/api/student/wishlist/status?ids=${batch.map((id) => encodeURIComponent(id)).join(",")}`, {
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to load wishlist statuses")
      }

      const result = await response.json()
      const statuses: Record<string, boolean> = result?.data?.statuses || {}

      for (const id of batch) {
        const value = Boolean(statuses[id])
        cache.set(id, { value, timestamp: Date.now() })
        const listeners = resolvers.get(id) || []
        listeners.forEach(({ resolve }) => resolve(value))
      }
    } catch (error) {
      const allListeners = Array.from(resolvers.values())
      for (const listeners of allListeners) {
        listeners.forEach(({ reject }: { reject: (error: any) => void }) => reject(error))
      }
    }
  }, 0)
}

export function enqueueWishlistStatusFetch(id: string): Promise<boolean> {
  const cached = cache.get(id)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Promise.resolve(cached.value)
  }

  return new Promise<boolean>((resolve, reject) => {
    const listeners = queue.get(id) || []
    listeners.push({ resolve, reject })
    queue.set(id, listeners)
    scheduleFlush()
  })
}

export function primeWishlistStatusCache(id: string, value: boolean) {
  cache.set(id, { value, timestamp: Date.now() })
}


