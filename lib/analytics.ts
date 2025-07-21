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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      revenue: {
        total: 125000,
        thisMonth: 12500,
        lastMonth: 11200,
        growth: 11.6,
      },
      accommodations: {
        total: 45,
        active: 42,
        pending: 3,
        growth: 8.5,
      },
      providers: {
        total: 28,
        active: 26,
        newThisMonth: 3,
        growth: 12.0,
      },
      bookings: {
        total: 1250,
        thisMonth: 145,
        lastMonth: 132,
        growth: 9.8,
      },
      views: {
        total: 25000,
        thisMonth: 3200,
        lastMonth: 2800,
        growth: 14.3,
      },
    }
  }

  static async getRevenueChart(period: "7d" | "30d" | "90d" | "1y"): Promise<ChartData> {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const labels =
      period === "7d"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        : period === "30d"
          ? Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`)
          : period === "90d"
            ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            : ["Q1", "Q2", "Q3", "Q4"]

    const data = labels.map(() => Math.floor(Math.random() * 5000) + 1000)

    return {
      labels,
      datasets: [
        {
          label: "Revenue (R)",
          data,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
        },
      ],
    }
  }

  static async getTopPerformers(): Promise<TopPerformer[]> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    return [
      { id: "1", name: "Campus View Apartments", value: 4200, change: 15.2, type: "accommodation" },
      { id: "2", name: "Sunny Side Residence", value: 3500, change: 8.7, type: "accommodation" },
      { id: "3", name: "Smith Properties", value: 8500, change: 22.1, type: "provider" },
      { id: "4", name: "Modern Student Hub", value: 3800, change: 12.3, type: "accommodation" },
      { id: "5", name: "ABC Housing Ltd", value: 6200, change: 18.9, type: "provider" },
    ]
  }

  static async getSystemHealth(): Promise<SystemHealth> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      apiLatency: {
        average: 85,
        status: "good",
      },
      errorRate: {
        rate: 0.2,
        status: "good",
      },
      database: {
        status: "online",
      },
      uptime: {
        percentage: 99.98,
        status: "good",
      },
    }
  }
}
