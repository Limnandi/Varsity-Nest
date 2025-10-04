import { captureMessage, setExtra } from '@/lib/logging/config';

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]>;

  private constructor() {
    this.metrics = new Map();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startMetric(name: string): () => void {
    const start = globalThis.performance.now();
    
    return () => {
      const end = globalThis.performance.now();
      const duration = end - start;
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      
      this.metrics.get(name)?.push(duration);
      
      // Report to Sentry if in production
      if (process.env.NODE_ENV === 'production') {
        try {
          // Add a lightweight message for traceability
          captureMessage(`${name} took ${duration}ms`, { level: 'info', component: 'performance_monitor', metric: name, duration })
        } catch (e) {
          // ignore
        }
      }
    };
  }

  public getMetricStats(name: string) {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: measurements.length,
      p95: sorted[p95Index],
    };
  }

  public clearMetrics(): void {
    this.metrics.clear();
  }

  public reportMetrics(): void {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Iterate over metric names to avoid unused parameter lint warnings
    for (const name of Array.from(this.metrics.keys())) {
      const stats = this.getMetricStats(name);
      if (stats) {
        try {
          // Use setExtra to attach metric stats
          setExtra(`performance_${name}`, stats);
        } catch (e) {
          // ignore
        }
      }
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Usage example:
// const endMetric = performanceMonitor.startMetric('database_query');
// ... do something ...
// endMetric();
// const stats = performanceMonitor.getMetricStats('database_query');
