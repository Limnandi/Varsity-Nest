export interface AnalyticsData {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  accommodations: {
    total: number
    active: number
    pending: number
    growth: number
  }
  providers: {
    total: number
    active: number
    newThisMonth: number
    growth: number
  }
  bookings: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  views: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    tension?: number
  }[]
}

export interface TopPerformer {
  id: string
  name: string
  value: number
  change: number
  type: "accommodation" | "provider"
}

export interface SystemHealth {
  apiLatency: {
    average: number
    status: "good" | "average" | "poor"
  }
  errorRate: {
    rate: number
    status: "good" | "average" | "poor"
  }
  database: {
    status: "online" | "degraded" | "offline"
  }
  uptime: {
    percentage: number
    status: "good" | "average" | "poor"
  }
}

export class AnalyticsService {
  static async getOverviewData(): Promise<AnalyticsData> {
    try {
      const response = await fetch('/api/admin/analytics/overview')
      if (!response.ok) throw new Error('Failed to fetch analytics data')
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch analytics overview:', error)
      // Return empty/zero data instead of mock data
      return {
        revenue: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
        accommodations: { total: 0, active: 0, pending: 0, growth: 0 },
        providers: { total: 0, active: 0, newThisMonth: 0, growth: 0 },
        bookings: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
        views: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
      }
    }
  }

  static async getRevenueChart(period: "7d" | "30d" | "90d" | "1y"): Promise<ChartData> {
    try {
      const response = await fetch(`/api/admin/analytics/revenue?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch revenue chart data')
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch revenue chart:', error)
      // Return empty chart data instead of mock data
      return {
        labels: [],
        datasets: [{
          label: "Revenue (R)",
          data: [],
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
        }],
      }
    }
  }

  static async getTopPerformers(): Promise<TopPerformer[]> {
    try {
      const response = await fetch('/api/admin/analytics/top-performers')
      if (!response.ok) throw new Error('Failed to fetch top performers')
      
      const data = await response.json()
      return data.performers || []
    } catch (error) {
      console.error('Failed to fetch top performers:', error)
      return []
    }
  }

  static async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await fetch('/api/admin/analytics/system-health')
      if (!response.ok) throw new Error('Failed to fetch system health')
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch system health:', error)
      // Return degraded status instead of mock data
      return {
        apiLatency: { average: 0, status: "poor" },
        errorRate: { rate: 100, status: "poor" },
        database: { status: "offline" },
        uptime: { percentage: 0, status: "poor" },
      }
    }
  }
}
