import { useEffect, useRef, useState, useCallback } from 'react'

interface PerformanceMetrics {
  renderTime?: number
  memoryUsage?: number
  componentMountTime?: number
}

export function usePerformance(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const mountTimeRef = useRef<number>(0)
  const renderStartRef = useRef<number>(0)

  useEffect(() => {
    mountTimeRef.current = performance.now()
    
    return () => {
      const componentMountTime = performance.now() - mountTimeRef.current
      
      setMetrics(prev => ({
        renderTime: prev?.renderTime,
        componentMountTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      }))
    }
  }, [])

  const startRender = () => {
    renderStartRef.current = performance.now()
  }

  const endRender = () => {
    const renderTime = performance.now() - renderStartRef.current
    
    setMetrics(prev => ({
      renderTime,
      componentMountTime: prev?.componentMountTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize
    }))

    // Log slow renders
    if (renderTime > 16) { // 60fps threshold
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
    }
  }

  return {
    metrics,
    startRender,
    endRender
  }
}

export function useLazyLoading<T>(
  items: T[],
  batchSize: number = 20,
  delay: number = 100
) {
  const [visibleItems, setVisibleItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setVisibleItems(items.slice(0, batchSize))
    setHasMore(items.length > batchSize)
  }, [items, batchSize])

  const loadMore = () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    
    setTimeout(() => {
      setVisibleItems(prev => {
        const nextBatch = items.slice(prev.length, prev.length + batchSize)
        const newItems = [...prev, ...nextBatch]
        
        setHasMore(newItems.length < items.length)
        setIsLoading(false)
        
        return newItems
      })
    }, delay)
  }

  return {
    visibleItems,
    loadMore,
    isLoading,
    hasMore
  }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(0)

  return useCallback(
    ((...args: any[]) => {
      const now = performance.now()
      
      if (now - lastRun.current >= delay) {
        lastRun.current = now
        return callback(...args)
      }
    }) as T,
    [callback, delay]
  )
}
