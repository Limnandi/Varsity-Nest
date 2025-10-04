"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import {
  AnalyticsService,
  type AnalyticsData,
  type SystemHealth,
  type ChartData,
  type TopPerformer,
} from "@/lib/analytics"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  Users,
  Home,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

export default function AnalyticsClient() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [revenueChart, setRevenueChart] = useState<ChartData | null>(null)
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d")

  useEffect(() => {
    loadAnalyticsData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const [overview, revenue, performers, health] = await Promise.all([
        AnalyticsService.getOverviewData(),
        AnalyticsService.getRevenueChart(period),
        AnalyticsService.getTopPerformers(),
        AnalyticsService.getSystemHealth(),
      ])

      setAnalyticsData(overview)
      setRevenueChart(revenue)
      setTopPerformers(performers)
      setSystemHealth(health)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  if (isLoading || !analyticsData || !systemHealth) {
    return (
      <AuthGuard requiredRole="admin">
        <DashboardLayout userRole="admin">
          <div className="space-y-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  const revenueChange = calculatePercentageChange(
    analyticsData.revenue.thisMonth,
    analyticsData.revenue.lastMonth
  )

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-8 p-6">
          {/* Header */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Platform Analytics</h1>
                <p className="text-neutral-300 text-lg">
                  Real-time insights into your accommodation platform
                </p>
              </div>
              <button
                onClick={() => loadAnalyticsData()}
                className="flex items-center gap-2 px-6 py-3 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <div className="group relative border border-white/10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 border border-blue-500/50 bg-blue-500/10 rounded-xl shadow-lg">
                  <DollarSign className="w-6 h-6 text-blue-300" />
                </div>
                {revenueChange !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${revenueChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {revenueChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(revenueChange).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-neutral-300">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(analyticsData.revenue.total)}</p>
                <p className="text-xs text-neutral-400">
                  {formatCurrency(analyticsData.revenue.thisMonth)} this month
                </p>
              </div>
            </div>

            {/* Total Accommodations */}
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 border border-purple-500/50 bg-purple-500/10 rounded-xl shadow-lg">
                  <Home className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-neutral-300">Accommodations</p>
                <p className="text-3xl font-bold">
                  {analyticsData.accommodations.total}
                </p>
                <p className="text-xs text-neutral-400">
                  {analyticsData.accommodations.active} active • {analyticsData.accommodations.pending} pending
                </p>
              </div>
            </div>

            {/* Total Providers */}
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 border border-green-500/50 bg-green-500/10 rounded-xl shadow-lg">
                  <Building className="w-6 h-6 text-green-400" />
                </div>
                {analyticsData.providers.newThisMonth > 0 && (
                  <span className="text-xs border border-green-500/50 bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                    +{analyticsData.providers.newThisMonth} new
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-neutral-300">Providers</p>
                <p className="text-3xl font-bold">
                  {analyticsData.providers.total}
                </p>
                <p className="text-xs text-neutral-400">
                  {analyticsData.providers.active} active providers
                </p>
              </div>
            </div>

            {/* Total Bookings */}
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 border border-orange-500/50 bg-orange-500/10 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-neutral-300">Bookings</p>
                <p className="text-3xl font-bold">
                  {analyticsData.bookings.total}
                </p>
                <p className="text-xs text-neutral-400">
                  {analyticsData.bookings.thisMonth} this month
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Revenue Overview</h2>
                <p className="text-sm text-neutral-300">Daily revenue trends</p>
              </div>
              <div className="flex gap-2">
                {(['7d', '30d', '90d'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      period === p
                        ? 'border border-blue-500/50 bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/20'
                        : 'border border-white/10 bg-black/20 text-neutral-300 hover:bg-white/5 hover:border-blue-500/30'
                    }`}
                  >
                    {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'Last 90 days'}
                  </button>
                ))}
              </div>
            </div>
            
            {revenueChart && revenueChart.labels.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueChart.labels.map((label, index) => ({
                      date: label,
                      revenue: revenueChart.datasets[0]?.data[index] || 0,
                    }))}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-neutral-400">
                <div className="p-4 border border-blue-500/30 bg-blue-500/10 rounded-2xl mb-4">
                  <DollarSign className="w-16 h-16 text-blue-400 opacity-40" />
                </div>
                <p className="text-lg font-medium text-neutral-300">No revenue data available</p>
                <p className="text-sm mt-2">Revenue data will appear here once payments are processed</p>
              </div>
            )}
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Top Performers</h2>
              <div className="space-y-4">
                {topPerformers.length > 0 ? (
                  topPerformers.slice(0, 5).map((performer, index) => (
                    <div
                      key={performer.id}
                      className="flex items-center justify-between p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-neutral-500 w-8">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-white">{performer.name}</p>
                          <p className="text-sm text-neutral-400 capitalize">
                            {performer.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">
                          {formatCurrency(performer.value)}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-green-400">
                          <TrendingUp className="w-3 h-3" />
                          +{performer.change}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-neutral-400 py-8">
                    No performance data available yet
                  </p>
                )}
              </div>
            </div>

            {/* System Health */}
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">System Health</h2>
              <div className="space-y-4">
                {/* Database Status */}
                <div className="flex items-center justify-between p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border border-blue-500/50 bg-blue-500/10 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="font-medium text-white">Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemHealth.database.status === 'online' ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-medium text-green-300">Online</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-sm font-medium text-red-300">Offline</span>
                      </>
                    )}
                  </div>
                </div>

                {/* API Latency */}
                <div className="flex items-center justify-between p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border border-purple-500/50 bg-purple-500/10 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="font-medium text-white">API Latency</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">
                      {systemHealth.apiLatency.average}ms
                    </span>
                    <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full border ${
                      systemHealth.apiLatency.status === 'good'
                        ? 'border-green-500/50 bg-green-500/20 text-green-300'
                        : systemHealth.apiLatency.status === 'average'
                        ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300'
                        : 'border-red-500/50 bg-red-500/20 text-red-300'
                    }`}>
                      {systemHealth.apiLatency.status}
                    </span>
                  </div>
                </div>

                {/* Error Rate */}
                <div className="flex items-center justify-between p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border border-orange-500/50 bg-orange-500/10 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="font-medium text-white">Error Rate</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">
                      {systemHealth.errorRate.rate}%
                    </span>
                    <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full border ${
                      systemHealth.errorRate.status === 'good'
                        ? 'border-green-500/50 bg-green-500/20 text-green-300'
                        : systemHealth.errorRate.status === 'average'
                        ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300'
                        : 'border-red-500/50 bg-red-500/20 text-red-300'
                    }`}>
                      {systemHealth.errorRate.status}
                    </span>
                  </div>
                </div>

                {/* Uptime */}
                <div className="flex items-center justify-between p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border border-green-500/50 bg-green-500/10 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="font-medium text-white">Uptime</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">
                      {systemHealth.uptime.percentage}%
                    </span>
                    <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full border ${
                      systemHealth.uptime.status === 'good'
                        ? 'border-green-500/50 bg-green-500/20 text-green-300'
                        : systemHealth.uptime.status === 'average'
                        ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300'
                        : 'border-red-500/50 bg-red-500/20 text-red-300'
                    }`}>
                      {systemHealth.uptime.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}


